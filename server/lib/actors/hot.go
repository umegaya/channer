package actors

import (
	"fmt"
	"time"
	"sort"
	"sync/atomic"

	proto "../../proto"
)

const (
	INVALID_BUCKET = iota
	UNIT_BUCKET
	HOUR_BUCKET
	DAY_BUCKET
	WEEK_BUCKET
	MONTH_BUCKET

	SUMMERY_BUCKET_START = 10
	SUMMERY_HOUR_BUCKET = 10
	SUMMERY_DAY_BUCKET = 11
	SUMMERY_WEEK_BUCKET = 12
	SUMMERY_MONTH_BUCKET = 13
	SUMMERY_YEAR_BUCKET = 14
	SUMMERY_ALL_BUCKET = 15
)

const (
	DEFAULT_BUCKET_SIZE = 1024 * 10
)

//
// HotEntry and its sorter
//
type HotEntry struct {
	id proto.UUID
	score uint64
}
type ByScore struct {
	entries []HotEntry
	indexes map[proto.UUID]int
}

func (b *ByScore) Len() int {
	return len(b.entries)
}
func (b *ByScore) Swap(i, j int) {
	idi, idj := b.entries[i].id, b.entries[j].id
	b.entries[i], b.entries[j] = b.entries[j], b.entries[i]
	b.indexes[idi], b.indexes[idj] = j, i
}
func (b *ByScore) Less(i, j int) bool {
	// > for sorting decreasing order
	return b.entries[i].score > b.entries[j].score
}


//
// bucket
//
type bucketType uint8
type bucket struct {
	typ bucketType //unit/hour/day/week/month/summery
	entries []HotEntry
	indexes map[proto.UUID]int
}

func NewBucket(typ bucketType, size int) *bucket {
	return &bucket {
		typ: typ,
		entries: make([]HotEntry, 0, size),
		indexes: make(map[proto.UUID]int),
	}
}

func NewBucketByEntries(typ bucketType, entries []HotEntry) *bucket {
	b := NewBucket(typ, len(entries))
	b.addEntries(entries)
	return b
}

func (b *bucket) add(delta *bucket) {
	b.addEntries(delta.entries)
}

func (b *bucket) addEntries(entries []HotEntry) {
	for _, e := range entries {
		i, ok := b.indexes[e.id]
		if ok {
			b.entries[i].score += e.score
		} else {
			b.indexes[e.id] = len(b.entries)
			b.entries = append(b.entries, e)
		}
	}
}

func (b *bucket) sort() *bucket {
	sort.Sort(&ByScore{
		entries: b.entries,
		indexes: b.indexes,
	})
	return b
}

func (b *bucket) rangeOf(start, count uint64) []HotEntry {
	last := start+count
	elen := uint64(len(b.entries))
	if last > elen {
		last = elen
	}
	return b.entries[start:last]
}

func (b *bucket) dupWithType(typ bucketType) *bucket {
	//CAUTION: here, often entries length is so long that it takes long time to finish
	//also this operation executed during another thread does read only access to entries.
	if typ == INVALID_BUCKET {
		typ = b.typ
	}
	return NewBucketByEntries(b.typ, b.entries)
}
func (b *bucket) dup() *bucket {
	return b.dupWithType(INVALID_BUCKET)
}


//
// bucketStore
//
type bucketStore struct {
	blen []int  //each bucket length
	unitCache [][]*bucket
	total *bucket
	//summery cache. plus current to get actual result
	summeries []*bucket
}

func NewBucketStore(blen []int, fill bool) *bucketStore {
	b := &bucketStore{
		blen: blen,
		unitCache: make([][]*bucket, 0, len(blen)),
		total: NewBucket(bucketType(SUMMERY_ALL_BUCKET), DEFAULT_BUCKET_SIZE),
		summeries: make([]*bucket, 0, len(blen)),
	}
	b.init(fill)
	return b
}

func (bs *bucketStore) capof(bucketIdx int) int {
	return (bs.blen[bucketIdx] - 1) * 2
}

func (bs *bucketStore) summeryBucketOf(typ proto.TopicListRequest_QueryType) *bucket {
	idx := 0
	switch typ {
	case proto.TopicListRequest_Hour:
		idx = SUMMERY_HOUR_BUCKET
	case proto.TopicListRequest_Day:
		idx = SUMMERY_DAY_BUCKET
	case proto.TopicListRequest_Week:
		idx = SUMMERY_WEEK_BUCKET
	case proto.TopicListRequest_Month:
		idx = SUMMERY_MONTH_BUCKET
	case proto.TopicListRequest_Year:
		idx = SUMMERY_YEAR_BUCKET
	case proto.TopicListRequest_AllTime:
		return bs.total
	default:
		return nil
	}
	return bs.summeries[idx - SUMMERY_BUCKET_START]
}

func (bs *bucketStore) init(fill bool) {
	for i, _ := range bs.blen {
		bs.unitCache[i] = make([]*bucket, bs.capof(i))
		if fill {
			for j, _ := range bs.unitCache[i] {
				bs.unitCache[i][j] = NewBucket(bucketType(i + 1), 0)
			}
		}
	}
}

func (bs *bucketStore) update(b *bucket) *bucketStore {
	bsr := NewBucketStore(bs.blen, false)
	//first, create next generation bucketStore
	for i, l := range bs.blen {
		c := bs.unitCache[i]
		if b == nil {
			//we can copy entire slice, because new bucket b has already processed. 
			bsr.unitCache[i] = c
		} else if cap(c) <= len(c) {
			//unitCache of index i is overflow. 
			if (i + 1) < len(bs.blen) {
				//create new bucket and promote to next bucket type.
				tmp := NewBucket(bucketType(i + 2), DEFAULT_BUCKET_SIZE) // + 2 for generating next bucket type.
				//sum first l bucket and move it to next bucket (eg. hour to day, day to week)
				for _, unit := range c[0:l-1] {
					tmp.add(unit)
				}
				//we can use shallow copy, because content of unitCache is immutable.
				copy(bsr.unitCache[i], c[l:])
				bsr.unitCache[i] = append(bsr.unitCache[i], b)
				b = tmp
			} else {
				//this is last bucket (currently month buckets). need to update all-time bucket
				bsr.total = bs.total.dup() //make deep copy to modify it.
				bsr.total.add(b)
			}
		} else { // unitCache has enough room. just add bucket.
			//we can use shallow copy, because content of unitCache is immutable.
			copy(bsr.unitCache[i], c)
			bsr.unitCache[i] = append(bsr.unitCache[i], b)
			//we can shallow copy all-time bucket, because no change happen to it.
			bsr.total = bs.total
			b = nil //mark new bucket has already processed.
		}
	}
	//next, re-calculate hot entries.
	c := NewBucket(bucketType(SUMMERY_BUCKET_START), DEFAULT_BUCKET_SIZE)
	for i, l := range bs.blen {
		tmp := bsr.unitCache[i]
		for _, b := range tmp[len(tmp)-l:] {
			c.add(b)
		}
		//dupe and sort
		bsr.summeries[i] = c.dupWithType(bucketType(i + SUMMERY_BUCKET_START)).sort()
	}
	return bsr
}


//
// HotActor
//
type queryType uint8
type HotActor struct {
	tick *time.Ticker
	locale string   
	lastQuery time.Time
	fetcher func (start, end time.Time, locale string) ([]HotEntry, error) //for test. 
	store atomic.Value //stores *bucketStore
}

func (a *HotActor) task() {
	for {
		select {
		case t := <- a.tick.C:
			a.update(t)
		}
	}	
}

func (a *HotActor) update(t time.Time) (err error) {
	defer func() {
		if err == nil {
			a.lastQuery = t
		}
	}()
	var entries []HotEntry
	if entries, err = a.fetcher(a.lastQuery, t, a.locale); err != nil {
		return 
	}
	b := NewBucketByEntries(UNIT_BUCKET, entries)
	prev := a.store.Load().(*bucketStore)
	next := prev.update(b)
	a.store.Store(next)
	go a.persist(a.lastQuery, prev)
	return nil
}

func (a *HotActor) persist(at time.Time, store *bucketStore) error {
	return nil
}

func (a *HotActor) destroy() {

}

func (a *HotActor) Query(typ proto.TopicListRequest_QueryType, start, count uint64) ([]HotEntry, error) {
	s := a.store.Load().(*bucketStore).summeryBucketOf(typ)
	if s == nil {
		return nil, fmt.Errorf("invalid query type: %v", typ)
	}
	return s.rangeOf(start, count), nil
}

func NewHotActorWithDetail(locale string, spanSec uint32, blen []int, 
	fetcher func (start, end time.Time, locale string) ([]HotEntry, error)) (*HotActor, error) {
	span := time.Duration(spanSec) * time.Second
	bs := NewBucketStore(blen, true)
	a := &HotActor {
		tick: time.NewTicker(span),
		locale: locale,
		fetcher: fetcher,
	}
	a.store.Store(bs)
	go a.task()
	return a, nil
}

func NewHotActor(locale string, spanSec uint32) (*HotActor, error) {
	unitPerHour := int((1 * time.Hour) / time.Duration(spanSec))
	blen := []int{ unitPerHour, 24, 7, 4, 12 } //units, hours, days, weeks, months
	return NewHotActorWithDetail(locale, spanSec, blen, topicFetcher)
}
