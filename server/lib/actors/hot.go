package actors

import (
	//"log"
	"fmt"
	"time"
	"sort"
	"sync"
	"sync/atomic"

	proto "github.com/umegaya/channer/server/proto"
)

const (
	SUMMERY_HOUR_HOTBUCKET = iota
	SUMMERY_DAY_HOTBUCKET
	SUMMERY_WEEK_HOTBUCKET
	SUMMERY_MONTH_HOTBUCKET
	SUMMERY_YEAR_HOTBUCKET
	SUMMERY_ARCHIVE_HOTBUCKET
	SUMMERY_ALLTIME_HOTBUCKET
)

const (
	DEFAULT_HOTBUCKET_SIZE = 1024 * 10
	ALLTIME_SUMMERY_LIMIT = 10000
)

//
// FetchResult 
//
// FetchResult represents data format which fetcher should return
type FetchResult struct {
	id proto.UUID		//target id
	parent proto.UUID	//target parent id. FetchResult will be group by parent
	score uint64		//target score. higher score regard as "hot".
}


//
// entry and its sorter
//
// HotEntry represents single hot object with its score and id
type HotEntry struct {
	id proto.UUID
	score uint64
}
// hotlist represents a set of HotEntry in certain category 
type hotlist struct {
	entries []HotEntry
	indexes map[proto.UUID]int
}

func NewHotList(size int) *hotlist {
	return &hotlist {
		entries: make([]HotEntry, 0, size),
		indexes: make(map[proto.UUID]int),
	}
}

func NewHotListByEntries(entries []HotEntry) *hotlist {
	l := NewHotList(len(entries))
	l.addEntries(entries)
	return l
}

func (l *hotlist) addEntries(entries []HotEntry) {
	for _, e := range entries {
		l.addEntry(e)
	}
}

func (l *hotlist) addEntry(e HotEntry) {
	i, ok := l.indexes[e.id]
	//log.Printf("addEntries: %v %v %v", e, i, len(l.entries))
	if ok {
		l.entries[i].score += e.score
	} else {
		l.indexes[e.id] = len(l.entries)
		l.entries = append(l.entries, e)
	}	
}

func (l *hotlist) dup() *hotlist {
	d := NewHotList(len(l.entries))
	d.addEntries(l.entries)
	return d
}

func (l *hotlist) rangeOf(start, count uint64) []HotEntry {
	last := start+count
	elen := uint64(len(l.entries))
	if last > elen {
		last = elen
	}
	return l.entries[start:last]
}

func (l *hotlist) Len() int {
	return len(l.entries)
}
func (l *hotlist) Swap(i, j int) {
	idi, idj := l.entries[i].id, l.entries[j].id
	l.entries[i], l.entries[j] = l.entries[j], l.entries[i]
	l.indexes[idi], l.indexes[idj] = j, i
}
func (l *hotlist) Less(i, j int) bool {
	// > for sorting decreasing order
	return l.entries[i].score > l.entries[j].score
}



//
// hothotbucket
//
// hothotbucket represents total and per-parent hotlists in certain terms (day/year/week...)
type hotbucket struct {
	total *hotlist
	groups map[proto.UUID]*hotlist
}

func NewHotBucket(size int) *hotbucket {
	return &hotbucket {
		total: NewHotList(size),
		groups: make(map[proto.UUID]*hotlist),
	}
}

func NewHotBucketByResults(results []FetchResult) *hotbucket {
	b := NewHotBucket(len(results))
	b.addResults(results)
	return b
}

//addResults adds []FetchResult to bucket
func (b *hotbucket) addResults(res []FetchResult) *hotbucket {
	for _, r := range res {
		e := HotEntry{ id: r.id, score: r.score }
		b.total.addEntry(e)
		l, ok := b.groups[r.id]
		if !ok {
			l = NewHotList(DEFAULT_HOTBUCKET_SIZE)
			b.groups[r.id] = l
		}
		l.addEntry(e)
	}
	return b
}

//add adds another hotbucket. delta can be nil
func (b *hotbucket) add(delta *hotbucket) *hotbucket {
	if delta != nil {
		b.total.addEntries(delta.total.entries)
		for id, l := range delta.groups {
			cl, ok := b.groups[id]
			if ok {
				cl.addEntries(l.entries)
			} else {
				b.groups[id] = cl
			}
		}
	}
	return b
}

func (b *hotbucket) sort() *hotbucket {
	sort.Sort(b.total)
	for _, l := range b.groups {
		sort.Sort(l)
	}
	return b
}

func (b *hotbucket) rangeOf(ids []proto.UUID, start, count uint64) ([]HotEntry, error) {
	if ids == nil || len(ids) <= 0 {
		return b.total.rangeOf(start, count), nil
	} else if len(ids) == 1 {
		l, ok := b.groups[ids[0]]
		if ok {
			return l.rangeOf(start, count), nil
		} else {
			return nil, fmt.Errorf("no such id: %v", ids[0])
		}
	} else {
		return nil, fmt.Errorf("ranged summeries of multiple channel not supported: %v", ids)
	}
}

func (b *hotbucket) dup() *hotbucket {
	br := &hotbucket {
		groups: make(map[proto.UUID]*hotlist),
	}
	br.total = b.total.dup()
	for id, l := range b.groups {
		br.groups[id] = l.dup()
	}
	return br
}


//
// hotbucketStore
//
type hotbucketStore struct {
	lengths []int  //how many bucket per hour/day/week/...
	cacheLen int
	caches [][]FetchResult //result FIFO cache of each query. smaller index has recent result
	summeries []*hotbucket //summeries cache
}

func NewHotBucketStore(lengths []int) *hotbucketStore {
	csize := 1
	for _, l := range lengths {
		csize *= l
	}
	bs := &hotbucketStore{
		lengths: lengths,
		cacheLen: 0,
		caches: make([][]FetchResult, 0, csize), 
		summeries: make([]*hotbucket, len(lengths)), 
	}
	return bs
}

func (bs *hotbucketStore) summeryBucketOf(typ proto.TopicListRequest_QueryType) *hotbucket {
	idx := 0
	switch typ {
	case proto.TopicListRequest_Hour:
		idx = SUMMERY_HOUR_HOTBUCKET
	case proto.TopicListRequest_Day:
		idx = SUMMERY_DAY_HOTBUCKET
	case proto.TopicListRequest_Week:
		idx = SUMMERY_WEEK_HOTBUCKET
	case proto.TopicListRequest_Month:
		idx = SUMMERY_MONTH_HOTBUCKET
	case proto.TopicListRequest_Year:
		idx = SUMMERY_YEAR_HOTBUCKET
	default:
		return nil
	}
	return bs.summeries[idx]
}

/*
http://expandedramblings.com/index.php/reddit-stats

73.15M topic / year
200410 topic / day
8350 topic / hour
139 topic / minute
2 topic / second

21M vote / day
875000 vote / hour
14583 vote / minute
243 vote / second

725.85M post / year
1988630 post / day
82859 post / hour
1380 post / minute
23 post / second

*/

func (bs *hotbucketStore) update(results []FetchResult) *hotbucketStore {
	bsr := NewHotBucketStore(bs.lengths)
	rmlen := 0
	//first, add fetch results to caches
	//log.Printf("len/cap = %v/%v", len(bs.caches), cap(bsr.caches))
	bsr.caches = append(bsr.caches, results)
	clen := len(bs.caches)
	if clen >= cap(bsr.caches) {
		rmlen = len(bs.caches[clen - 1])
		bsr.caches = append(bsr.caches, bs.caches[0:cap(bsr.caches)-1]...)
	} else {
		bsr.caches = append(bsr.caches, bs.caches...)
	}
	bsr.cacheLen = bs.cacheLen + len(results) - rmlen

	/*
		bs.lengths[1]が表すスパンの半分の時間(=T)が経つ毎にその時間分だけ昔を終点にしたalltimeのqueryをlimit 10000で行う
		その結果にbs.cachesの最新からTだけの時間分を足すことで「だいたい」alltimeのHotbucketが得られる。
		想定している想定だとbs.length[1]=24(24h)なので、12時間が経つ毎にその12時間前を終点にしたalltimeのqueryをlimit 10000で行う
		このalltimeクエリに最新１２時間分のbs.cachesを足し合わせると大体alltimeのHotBucketが得られる。
	*/

	//next, re-calculate hot entries. (hour/day)
	c := NewHotBucket(bsr.cacheLen)
	start := 0
	for i, l := range bsr.lengths {
		var end int
		if start > 0 {
			end = start * l
		} else {
			end = l			
		}
		//log.Printf("addResults: %v ~ %v", start, end)
		for _, results := range bsr.caches[start:end] {
			//log.Printf("results: %v", results)
			c.addResults(results)
		}
		start = end
		bsr.summeries[i] = c.dup().sort()
		//log.Printf("current: %v", bsr.summeries[i].total.entries)
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
	fetcher func (start, end time.Time, locale string) ([]FetchResult, error) //for test. 
	persist func (at time.Time, s *hotbucketStore) error
	store atomic.Value //stores *hotbucketStore
	lock sync.RWMutex
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
	var results []FetchResult
	if results, err = a.fetcher(a.lastQuery, t, a.locale); err != nil {
		return err
	}
	prev := a.store.Load().(*hotbucketStore)
	next := prev.update(results)
	a.store.Store(next)
	go a.save(a.lastQuery, prev)
	return nil
}

func (a *HotActor) save(at time.Time, bs *hotbucketStore) error {
	return a.persist(at, bs)
}

func (a *HotActor) destroy() {
	//please add shutdown stuff
}

func (a *HotActor) restore() error {
	//TODO: restore summeries and unitCaches from database or filesystem.
	return nil
}

func (a *HotActor) Query(typ proto.TopicListRequest_QueryType, ids []proto.UUID, start, count uint64) ([]HotEntry, error) {
	defer a.lock.RUnlock()
	a.lock.RLock()
	s := a.store.Load().(*hotbucketStore).summeryBucketOf(typ)
	if s == nil {
		return nil, fmt.Errorf("invalid query type: %v", typ)
	}
	return s.rangeOf(ids, start, count)
}

//for realtime updating
func (a *HotActor) Update(id proto.UUID, parent proto.UUID, score uint64) error {
	defer a.lock.Unlock()
	a.lock.Lock()
	added := []FetchResult{ FetchResult{id: id, parent: parent, score: score} }
	//because summeries of current a.store never referred by update thread, update thread does not need to acquired a.lock
	//Query/Update needs to exclude each other, and concurrent Query calls are possible.
	for _, s := range a.store.Load().(*hotbucketStore).summeries {
		s.addResults(added)
	}
	return nil
}

func NewHotActorWithDetail(locale string, spanSec uint32, lengths []int, noAutoUpdate bool, 
	fetcher func (start, end time.Time, locale string) ([]FetchResult, error), 
	persist func (at time.Time, s *hotbucketStore) error) (*HotActor, error) {
	span := time.Duration(spanSec) * time.Second
	bs := NewHotBucketStore(lengths)
	a := &HotActor {
		tick: time.NewTicker(span),
		locale: locale,
		fetcher: fetcher,
		persist: persist,
		lock: sync.RWMutex{},
	}
	if err := a.restore(); err != nil {
		a.destroy()
		return nil, err
	}
	a.store.Store(bs)
	if !noAutoUpdate {
		go a.task()
	}
	return a, nil
}

func NewHotActor(locale string, spanSec uint32) (*HotActor, error) {
	unitPerHour := int((1 * time.Hour) / time.Duration(spanSec))
	lengths := []int{ unitPerHour, 24 } //units, hours, days, weeks, months
	return NewHotActorWithDetail(locale, spanSec, lengths, false, topicFetcher, topicPersister)
}
