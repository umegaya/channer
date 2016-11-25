package actors

import (
	"log"
	"fmt"
	"time"
	"sort"
	"sync"
	"math"
	"sync/atomic"

	proto "github.com/umegaya/channer/server/proto"
	"github.com/umegaya/yue"
	"github.com/umegaya/channer/server/lib/utils"
	yuep "github.com/umegaya/yue/proto"
)

const (
	INVALID_HOTBUCKET = iota
	SUMMERY_HOUR_HOTBUCKET
	SUMMERY_DAY_HOTBUCKET
	SUMMERY_WEEK_HOTBUCKET
	SUMMERY_ALLTIME_HOTBUCKET
)

const (
	DEFAULT_HOTBUCKET_SIZE = 1024 * 10
	PER_CHANNEL_HOTBUCKET_SIZE = 64
	ALLTIME_SUMMERY_LIMIT = 10000
	GOAT_UPDATE_SPAN_SEC = 60 * 60 * 12 //12h
)

//
// FetchResult 
//
// FetchResult represents data format which fetcher should return
type FetchResult struct {
	id proto.UUID		//target id
	parent proto.UUID	//target parent id. FetchResult will be group by parent
	score int32			//target score. higher score regard as "hot".
	vote uint32 		//number of vote (up + down)
}


//
// entry and its sorter
//
// HotEntry represents single hot object with its score and id
type HotEntry struct {
	Id proto.UUID
	Score int32
	Vote uint32
}

func (e *HotEntry) within(start, end time.Time) bool {
	return yue.UUIDBetween(yuep.UUID(e.Id), start, end)
}

func (e *HotEntry) flamy() bool {
	if e.Vote < FLAME_VOTE_THRESHOLD {
		return false
	}
	return math.Abs(float64(e.Score) / float64(e.Vote)) < 2 * FLAME_THRESHOLD
}

func (e *HotEntry) lessThanByScore(score int32, id proto.UUID) bool {
	if e.Score < score {
		return true
	} else if e.Score > score {
		return false
	}
	return e.Id < id
}

func (e *HotEntry) lessThanByVote(vote uint32, id proto.UUID) bool {
	if e.Vote < vote {
		return true
	} else if e.Vote > vote {
		return false
	}
	return e.Id < id
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
	i, ok := l.indexes[e.Id]
	//log.Printf("addEntries: %v %v %v", e, i, len(l.entries))
	if ok {
		l.entries[i].Score += e.Score
		l.entries[i].Vote += e.Vote
	} else {
		l.indexes[e.Id] = len(l.entries)
		l.entries = append(l.entries, e)
	}
}

func (l *hotlist) dup() *hotlist {
	d := NewHotList(len(l.entries))
	d.addEntries(l.entries)
	return d
}

func (l *hotlist) sort(btyp proto.TopicListRequest_BucketType) {
	switch btyp {
	case proto.TopicListRequest_Rising, proto.TopicListRequest_Hot:
		sort.Sort(&ByScore{ l: l })
	case proto.TopicListRequest_Flame:
		sort.Sort(&ByVote{ l: l })
	default:
		panic(fmt.Sprintf("invalid bucket type %v", btyp))
	}
}

func (l *hotlist) indexByScore(btyp proto.TopicListRequest_BucketType, val int32, id proto.UUID) int {
	if id <= 0 {
		return 0
	}
	f := func (n int) bool {
		e := l.entries[n]
		return e.lessThanByScore(val, id)
	}
	if btyp == proto.TopicListRequest_Flame {
		f = func (n int) bool {
			e := l.entries[n]
			return e.lessThanByVote(uint32(val), id)
		}
	}
	return sort.Search(len(l.entries), f)
}

func (l *hotlist) rangeOf(btyp proto.TopicListRequest_BucketType, startScore int32, startId proto.UUID, count uint32) []HotEntry {
	start := l.indexByScore(btyp, startScore, startId)
	if start < 0 {
		return []HotEntry{}
	}
	last := uint32(start)+count
	elen := uint32(len(l.entries))
	if last > elen {
		last = elen
	}
	return l.entries[start:last]
}

func (l *hotlist) Len() int {
	return len(l.entries)
}
func (l *hotlist) Swap(i, j int) {
	idi, idj := l.entries[i].Id, l.entries[j].Id
	l.entries[i], l.entries[j] = l.entries[j], l.entries[i]
	l.indexes[idi], l.indexes[idj] = j, i
}


//by-score sorter
type ByScore struct {
	l *hotlist
}
func (by *ByScore) Len() int {
	return by.l.Len()
}
func (by *ByScore) Swap(i, j int) {
	by.l.Swap(i, j)
}
func (by *ByScore) Less(i, j int) bool {
	// > for sorting decreasing order
	e := by.l.entries[i]
	return by.l.entries[j].lessThanByScore(e.Score, e.Id)
}


//by vote sorter
type ByVote struct {
	l *hotlist
}
func (by *ByVote) Len() int {
	return by.l.Len()
}
func (by *ByVote) Swap(i, j int) {
	by.l.Swap(i, j)
}
func (by *ByVote) Less(i, j int) bool {
	// > for sorting decreasing order
	e := by.l.entries[i]
	return by.l.entries[j].lessThanByVote(e.Vote, e.Id)
}


//
// hothotbucket
//
// hothotbucket represents total and per-parent hotlists in certain terms (day/year/week...)
type hotbucket struct {
	lastUpdate time.Time
	total *hotlist
	groups map[proto.UUID]*hotlist
	idParentMap map[proto.UUID]proto.UUID
}

func NewHotBucket(size int) *hotbucket {
	return &hotbucket {
		total: NewHotList(size),
		groups: make(map[proto.UUID]*hotlist),
		idParentMap: make(map[proto.UUID]proto.UUID),
	}
}

func NewHotBucketWithLastUpdate(size int, lastUpdate time.Time) *hotbucket {
	hb := NewHotBucket(size)
	hb.lastUpdate = lastUpdate
	return hb
}

//addResults adds []FetchResult to bucket
func (b *hotbucket) addResults(res []FetchResult) *hotbucket {
	return b.addResultsWithFilter(res, nil)
}

func (b *hotbucket) addResultsWithFilter(res []FetchResult, filter func (e *HotEntry) bool) *hotbucket {
	for _, r := range res {
		e := &HotEntry{ Id: r.id, Score: r.score, Vote: r.vote }
		if filter != nil && !filter(e) {
			continue
		}
		b.addEntry(e, r.parent)
	}
	return b
}

func (b *hotbucket) addEntry(e *HotEntry, parent proto.UUID) {
	b.total.addEntry(*e)
	b.idParentMap[e.Id] = parent
	l, ok := b.groups[parent]
	if !ok {
		l = NewHotList(PER_CHANNEL_HOTBUCKET_SIZE)
		b.groups[parent] = l
	}
	l.addEntry(*e)
}

//filter filters hotentry with given filter function
func (b *hotbucket) filter(filt func (e *HotEntry) bool) *hotbucket {
	br := NewHotBucketWithLastUpdate(len(b.total.entries), b.lastUpdate)
	for _, e := range b.total.entries {
		if filt(&e) {
			br.addEntry(&e, b.idParentMap[e.Id])
		}
	}
	return br
}

//add adds another hotbucket. delta can be nil
func (b *hotbucket) add(delta *hotbucket) *hotbucket {
	if delta != nil {
		b.total.addEntries(delta.total.entries)
		for parent, l := range delta.groups {
			cl, ok := b.groups[parent]
			if ok {
				cl.addEntries(l.entries)
			} else {
				b.groups[parent] = cl.dup()
			}
		}
	}
	return b
}

func (b *hotbucket) sort(btyp proto.TopicListRequest_BucketType) *hotbucket {
	b.total.sort(btyp)
	for _, l := range b.groups {
		l.sort(btyp)
	}
	return b
}

//truncate bucket with specified size.
func (b *hotbucket) truncate(size int) *hotbucket {
	if size > len(b.total.entries) {
		size = len(b.total.entries)
	}
	br := NewHotBucketWithLastUpdate(len(b.total.entries), b.lastUpdate)
	for _, e := range b.total.entries[0:size] {
		br.addEntry(&e, b.idParentMap[e.Id])
	}
	br.lastUpdate = b.lastUpdate
	return br
}

func (b *hotbucket) rangeOf(ids []proto.UUID, btyp proto.TopicListRequest_BucketType, 
	startScore int32, startId proto.UUID, count uint32) ([]HotEntry, error) {
	if ids == nil || len(ids) <= 0 {
		return b.total.rangeOf(btyp, startScore, startId, count), nil
	} else if len(ids) == 1 {
		l, ok := b.groups[ids[0]]
		if ok {
			return l.rangeOf(btyp, startScore, startId, count), nil
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
		total: b.total.dup(),
		idParentMap: make(map[proto.UUID]proto.UUID),
		lastUpdate: b.lastUpdate,
	}
	for id, l := range b.groups {
		br.groups[id] = l.dup()
	}
	for id, parent := range b.idParentMap {
		br.idParentMap[id] = parent
	}
	return br
}

func (b *hotbucket) markUpdate(t time.Time) *hotbucket {
	b.lastUpdate = t
	return b
}


//
// hotbucketStore
//
type hotbucketStore struct {
	lengths []int  //how many bucket per hour/day
	cacheLen int
	caches []fetchCache //raw result FIFO cache of each query. smaller index has recent result
	//summeries cache
	risings []*hotbucket //acquire most point in during a hour/day
	hots []*hotbucket //acquire most point among all objects which is created in duraing a hour/day/week/alltime
	flames []*hotbucket //40~60% upvote and 
}

type fetchCache struct {
	fetchAt time.Time
	results []FetchResult
}

func NewHotBucketStore(lengths []int) *hotbucketStore {
	csize := 1
	for _, l := range lengths {
		csize *= l
	}
	bs := &hotbucketStore{
		lengths: lengths,
		cacheLen: 0,
		caches: make([]fetchCache, 0, csize), 
		risings: make([]*hotbucket, proto.TopicListRequest_Day), 
		hots: make([]*hotbucket, proto.TopicListRequest_AllTime),
		flames: make([]*hotbucket, proto.TopicListRequest_AllTime),
	}
	return bs
}

func (bs *hotbucketStore) summeryBucketOf(btyp proto.TopicListRequest_BucketType, typ proto.TopicListRequest_QueryType) *hotbucket {
	var bkts []*hotbucket
	switch btyp {
	case proto.TopicListRequest_Rising:
		bkts = bs.risings
		if typ != proto.TopicListRequest_Hour && typ != proto.TopicListRequest_Day {
			return nil
		}
	case proto.TopicListRequest_Hot:
		bkts = bs.hots
	case proto.TopicListRequest_Flame:
		bkts = bs.flames
	default:
		return nil
	}

	idx := 0
	switch typ {
	case proto.TopicListRequest_Hour:
		idx = SUMMERY_HOUR_HOTBUCKET
	case proto.TopicListRequest_Day:
		idx = SUMMERY_DAY_HOTBUCKET
	case proto.TopicListRequest_Week:
		idx = SUMMERY_WEEK_HOTBUCKET
	case proto.TopicListRequest_AllTime:
		idx = SUMMERY_ALLTIME_HOTBUCKET
	default:
		return nil
	}
	log.Printf("bks: %v %v %v", idx, btyp, typ)
	return bkts[idx - 1]
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

func (bs *hotbucketStore) update(fetchAt time.Time, results []FetchResult) *hotbucketStore {
	bsr := NewHotBucketStore(bs.lengths)
	rmlen := 0
	cache := fetchCache{ fetchAt: fetchAt, results: results }
	//first, add fetch results to caches
	log.Printf("len/cap = %v/%v", len(bs.caches), cap(bsr.caches))
	bsr.caches = append(bsr.caches, cache)
	clen := len(bs.caches)
	if clen >= cap(bsr.caches) {
		for _, c := range bs.caches[cap(bsr.caches)-1:] {
			rmlen += len(c.results)
		}
		bsr.caches = append(bsr.caches, bs.caches[0:cap(bsr.caches)-1]...)
	} else {
		bsr.caches = append(bsr.caches, bs.caches...)
	}
	bsr.cacheLen = bs.cacheLen + len(results) - rmlen

	//next, re-calculate rising entries. (hour/day)
	b := NewHotBucket(bsr.cacheLen)
	start := 0
	for i, l := range bsr.lengths {
		var end int
		if start > 0 {
			end = start * l
		} else {
			end = l			
		}
		log.Printf("addResults: %v ~ %v", start, end)
		for _, c := range bsr.caches[start:end] {
			//log.Printf("results: %v", results)
			b.addResults(c.results)
		}
		start = end
		//fetchAt is same as latest fetchCache's fetchAt
		bsr.risings[i] = b.dup().sort(proto.TopicListRequest_Rising).markUpdate(fetchAt)
		log.Printf("risings: %v set", i)
		//log.Printf("current: %v", bsr.risings[i].total.entries)
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
	lastQueryCacheUpdate time.Time
	fetcher func (ftype proto.TopicListRequest_BucketType, start, end time.Time, locale string) ([]FetchResult, error)
	persist func (at time.Time, s *hotbucketStore) error
	store atomic.Value //stores *hotbucketStore
	hotQueryCache []atomic.Value //stores *hotbucket
	flameQueryCache []atomic.Value //stores *hotbucket
	queryDurations []time.Duration
	queryCacheUpdated int32 //goat update checker
	lock sync.RWMutex //for synchoronize actor method call
	available bool
	wg *utils.WaitGroup
}

func (a *HotActor) task() {
	t := time.Now()
	//do first update 
	a.update(t)
	a.updateQueryCache(t)
	for {
		select {
		case t := <- a.tick.C:
			a.update(t)
			go a.updateQueryCache(t)
			utils.DumpMemUsage()
		}
	}	
}

func (a *HotActor) updateQueryCache(t time.Time) error {
	defer atomic.CompareAndSwapInt32(&a.queryCacheUpdated, 1, 0)
	if !atomic.CompareAndSwapInt32(&a.queryCacheUpdated, 0, 1) {
		return nil
	}
	if (t.Unix() - a.lastQueryCacheUpdate.Unix()) < GOAT_UPDATE_SPAN_SEC {
		return nil
	}
	qcsize := len(a.queryDurations)
	a.wg = utils.NewWaitGroup(2 * qcsize) //hot and flame
	var from time.Time
	for i := 0; i < qcsize; i++ {
		if a.queryDurations[i] > 0 {
			from = t.Add(-1 * a.queryDurations[i])
		} else {
			from = time.Time{}			
		}
		go a.updateQueryCacheTask(from, t, proto.TopicListRequest_Hot, &a.hotQueryCache[i], a.wg)
		go a.updateQueryCacheTask(from, t, proto.TopicListRequest_Flame, &a.flameQueryCache[i], a.wg)
	}
	if err := a.wg.Wait(); err != nil {
		log.Printf("update fails with %v", err)
		a.available = false
		return err
	} else {
		log.Printf("update success")
		a.available = true		
		a.lastQueryCacheUpdate = t
	}
	return nil
}

func (a *HotActor) updateQueryCacheTask(from, to time.Time, btyp proto.TopicListRequest_BucketType, ret *atomic.Value, wg *utils.WaitGroup) {
	var (
		results []FetchResult
		err error
	)
	defer func () {
		wg.Done(err)
	}()
	if results, err = a.fetcher(btyp, from, to, a.locale); err != nil {
		return
	}
	//store new fetch results to current top 10000
	next := NewHotBucket(DEFAULT_HOTBUCKET_SIZE).addResults(results).sort(btyp).truncate(ALLTIME_SUMMERY_LIMIT).markUpdate(to)
	ret.Store(next)
}

func (a *HotActor) mergeFetchResult(next *hotbucketStore, now time.Time) {
	/*
		calculate hot and flame	by merging next.risings to a.queryCache
	*/
	//hour/day hot and flame. simply filter risings[0] and rising[1].
	i := 0
	to := now
	for ; i < len(next.risings); i++ {
		var from time.Time
		if i == 0 {
			from = to.Add(-1 * time.Hour)
		} else if i == 1 {
			from = to.Add(-24 * time.Hour)
		} 
		next.hots[i] = next.risings[i].filter(func (e *HotEntry) bool {
			//log.Printf("hots: %v %v %v %v %v", e, from, to, yue.DateByUUID(yuep.UUID(e.Id)), e.within(from, to))
			return e.within(from, to)
		}).sort(proto.TopicListRequest_Hot).truncate(DEFAULT_HOTBUCKET_SIZE).markUpdate(now)
		next.flames[i] = next.risings[i].filter(func (e *HotEntry) bool {
			return e.within(from, to) && e.flamy()
		}).sort(proto.TopicListRequest_Flame).truncate(DEFAULT_HOTBUCKET_SIZE).markUpdate(now)
	}

	//log.Printf("mergeFetchResult2")
	//week/alltime hot and flame. merge query results and fetchCaches
	for ; i < (len(next.risings) + len(a.queryDurations)); i++ {
		index := i - len(next.risings)
		next.hots[i] = a.hotQueryCache[index].Load().(*hotbucket)
		next.flames[i] = a.flameQueryCache[index].Load().(*hotbucket)
		from := to.Add(-1 * a.queryDurations[index])
		var filter func (e *HotEntry) bool = nil 
		if index == 0 {
			filter = func (e *HotEntry) bool {
				return e.within(from, to)
			}
		}
		for _, c := range next.caches {
			//if filter == nil {
			//	log.Printf("alltime hot: %v %v %v", c.fetchAt, next.hots[i].lastUpdate, c.results)
			//}
			if c.fetchAt.UnixNano() > next.hots[i].lastUpdate.UnixNano() {
				next.hots[i].addResultsWithFilter(c.results, filter)
			}
			if c.fetchAt.UnixNano() > next.flames[i].lastUpdate.UnixNano() {
				next.flames[i].addResultsWithFilter(c.results, filter)
			}
		}
		//hots just reorder. set position of markUpdate prior to truncate is important because truncate create new instance,
		//which means markupdate after truncate does not propagate to original data (a.***QueryCache)
		next.hots[i] = next.hots[i].markUpdate(now).sort(proto.TopicListRequest_Hot).truncate(DEFAULT_HOTBUCKET_SIZE)
		//flames will be filtered, because each of its element may be non flamy. (also be careful about position of markUpdate)
		next.flames[i] = next.flames[i].markUpdate(now).filter(func (e *HotEntry) bool {
			return e.flamy()
		}).sort(proto.TopicListRequest_Flame).truncate(DEFAULT_HOTBUCKET_SIZE).markUpdate(now)
	}
}

func (a *HotActor) update(t time.Time) (err error) {
	defer func() {
		if err == nil {
			a.lastQuery = t
		}
	}()
	var results []FetchResult
	if results, err = a.fetcher(proto.TopicListRequest_Rising, a.lastQuery, t, a.locale); err != nil {
		return err
	}
	prev := a.store.Load().(*hotbucketStore)
	next := prev.update(t, results)
	a.mergeFetchResult(next, t)
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

func (a *HotActor) Available() bool {
	return a.available
}

func (a *HotActor) Query(btyp proto.TopicListRequest_BucketType, typ proto.TopicListRequest_QueryType, 
	ids []proto.UUID, startScore int32, startId proto.UUID, count uint32) ([]HotEntry, error) {
	defer a.lock.RUnlock()
	a.lock.RLock()
	if !a.available {
		return nil, &proto.Err{ Type: proto.Error_TemporaryUnavailable }
	}
	s := a.store.Load().(*hotbucketStore).summeryBucketOf(btyp, typ)
	if s == nil {
		return nil, fmt.Errorf("invalid query type: %v %v", btyp, typ)
	}
	return s.rangeOf(ids, btyp, startScore, startId, count)
}

//for realtime updating
func (a *HotActor) Update(id proto.UUID, parent proto.UUID, score int32, vote uint32) error {
	defer a.lock.Unlock()
	a.lock.Lock()
	if !a.available {
		return &proto.Err{ Type: proto.Error_TemporaryUnavailable }
	}
	added := []FetchResult{ FetchResult{id: id, parent: parent, score: score, vote: vote} }
	//because summeries of current a.store never referred by update thread, update thread does not need to acquired a.lock
	//Query/Update needs to exclude each other, and concurrent Query calls are possible.
	for _, s := range a.store.Load().(*hotbucketStore).risings {
		s.addResults(added)
	}
	for _, s := range a.store.Load().(*hotbucketStore).hots {
		s.addResults(added)
	}
	for _, s := range a.store.Load().(*hotbucketStore).flames {
		s.addResults(added)
	}
	return nil
}

func NewHotActorWithDetail(locale string, updateSpan time.Duration, lengths []int, noAutoUpdate bool, 
	fetcher func (ftype proto.TopicListRequest_BucketType, start, end time.Time, locale string) ([]FetchResult, error), 
	persist func (at time.Time, s *hotbucketStore) error) (*HotActor, error) {
	bs := NewHotBucketStore(lengths)
	durations := []time.Duration {
		7 * 24 * time.Hour,		//week
		0,						//alltime
	}
	if locale == "all" {
		locale = ""
	}
	queryCacheSize := len(durations)
	a := &HotActor {
		tick: time.NewTicker(updateSpan),
		locale: locale,
		fetcher: fetcher,
		persist: persist,
		hotQueryCache: make([]atomic.Value, queryCacheSize),
		flameQueryCache: make([]atomic.Value, queryCacheSize),
		queryDurations: durations,
		lock: sync.RWMutex{},
		available: false,
	}
	if err := a.restore(); err != nil {
		a.destroy()
		return nil, err
	}
	a.store.Store(bs)
	for i := 0; i < queryCacheSize; i++ {
		hot := NewHotBucket(DEFAULT_HOTBUCKET_SIZE)
		flame := NewHotBucket(DEFAULT_HOTBUCKET_SIZE)
		a.hotQueryCache[i].Store(hot)
		a.flameQueryCache[i].Store(flame)
		bs.hots[i] = hot
		bs.flames[i] = flame
	}
	if !noAutoUpdate {
		go a.task()
	}
	return a, nil
}

func NewHotActor(locale string, updateSpan time.Duration) (*HotActor, error) {
	unitPerHour := int((1 * time.Hour) / updateSpan)
	lengths := []int{ unitPerHour, 24 } //units, hours, days, weeks, months
	return NewHotActorWithDetail(locale, updateSpan, lengths, false, topicFetcher, topicPersister)
}
