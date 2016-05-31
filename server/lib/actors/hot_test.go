package actors

import (
	"testing"
	"log"

	"fmt"
	"time"
	"sync"
	"math/rand"

	"github.com/umegaya/yue"
	proto "github.com/umegaya/channer/server/proto"
	//yuep "github.com/umegaya/yue/proto"
)

const (
	ENTRY_PER_FETCH = 10
	ITER_COUNT = 50
	NEWLY_ADD_RATE = 0.3
)

var node *yue.Node = &yue.Node {}

var estimates []fetchCache = make([]fetchCache, 0)
var lastFilter time.Time
//var parentMap map[proto.UUID]proto.UUID = make(map[proto.UUID]proto.UUID)
var mutex sync.Mutex 
var clock time.Time = time.Now()

func addClock() {
	clock = clock.Add(30 * time.Minute)
}

func getClock() time.Time {
	return clock
}

func testInmemVoteFetcher() ([]FetchResult, error) {
	entries := make([]FetchResult, ENTRY_PER_FETCH)
	i := 0
	if len(estimates) > 0 {
		sampleEntries := estimates[len(estimates) - 1]
		//log.Printf("sampleEntries: %v", sampleEntries)
		for ;i < int(float64(1 - NEWLY_ADD_RATE) * ENTRY_PER_FETCH); i++ {
			//add score to existing entry
			sample := sampleEntries.results[rand.Int31n(int32(len(sampleEntries.results)))]
			up,down := int32(rand.Int31n(50) + 1), int32(rand.Int31n(50) + 1)
			entries[i] = FetchResult {
				id: sample.id,
				score: up - down,
				parent: sample.parent,
				vote: uint32(up + down),
			}
		}
	}
	//make clock backward to assure all generated ids have timestamp before current getClock()
	genClock := getClock().Add(-1 * time.Second)
	for ;i < ENTRY_PER_FETCH; i++ {
		//add new entry
		up,down := int32(rand.Int31n(50) + 1), int32(rand.Int31n(50) + 1)
		entries[i] = FetchResult {
			id: proto.UUID(node.GenUUID(genClock)),
			score: up - down,
			parent: proto.UUID(rand.Int31n(50) + 1),
			vote: uint32(up + down),
		}
		//parentMap[entries[i].id] = entries[i].parent
	}
	log.Printf("testInmemVoteFetcher: %v", entries)
	estimates = append(estimates, fetchCache {
		fetchAt: getClock(),
		results: entries,
	})
	return entries, nil	
}

func filterSummery(btyp proto.TopicListRequest_BucketType, b *hotbucket) *hotbucket {
	if btyp == proto.TopicListRequest_Flame {
		return b.filter(func (e *HotEntry) bool {
			return e.flamy()
		}).sort(btyp).truncate(ALLTIME_SUMMERY_LIMIT)
	} else {
		return b.sort(btyp).truncate(ALLTIME_SUMMERY_LIMIT)
	}
}

func testInmemVoteParentFetcher(start, end time.Time, btyp proto.TopicListRequest_BucketType) ([]FetchResult, error) {
	tmp := NewHotBucket(ENTRY_PER_FETCH)
	for _, e := range estimates {
		if start.Unix() <= e.fetchAt.Unix() && e.fetchAt.Unix() <= end.Unix() {
			tmp.addResults(e.results)
		} else if start.Unix() <= 0 {
			log.Printf("testInmemVoteParentFetcher: alltime query but missing: %v %v", e.fetchAt, end)
		}
	}
	tmp = filterSummery(btyp, tmp)
	ret := make([]FetchResult, len(tmp.total.entries))
	for i, e := range tmp.total.entries {
		ret[i] = FetchResult{ id: e.Id, parent: tmp.idParentMap[e.Id], vote: e.Vote, score: e.Score }
	}
	lastFilter = end
	log.Printf("testInmemVoteParentFetcher: %v %v %v", btyp, lastFilter, ret)
	return ret, nil
}

func testInmemFetcher(btyp proto.TopicListRequest_BucketType, start, end time.Time, locale string) ([]FetchResult, error) {
	switch btyp {
	case proto.TopicListRequest_Rising:
		return testInmemVoteFetcher()
	case proto.TopicListRequest_Hot, proto.TopicListRequest_Flame:
		return testInmemVoteParentFetcher(start, end, btyp)
	default:
		return nil, fmt.Errorf("invalid fetchType: %v", btyp)
	}
}

func testInmemPersister(at time.Time, s *hotbucketStore) error {
	return nil
}

func estimateResults(btyp proto.TopicListRequest_BucketType, typ proto.TopicListRequest_QueryType, start, count uint64) []HotEntry {
	var begin, end time.Time;
	end = getClock()
	switch typ {
	case proto.TopicListRequest_Hour:
		begin = end.Add(-1 * time.Hour)
	case proto.TopicListRequest_Day:
		begin = end.Add(-24 * time.Hour)
	case proto.TopicListRequest_Week:
		begin = end.Add(-7 * 24 * time.Hour)
	case proto.TopicListRequest_AllTime:
		begin = time.Time{}
	}
	tmp := NewHotBucket(ENTRY_PER_FETCH)
	for _, e := range estimates {
		switch btyp {
		case proto.TopicListRequest_Rising:
			//rising is calculated for votes which is done in specified term. so add all if its in specified term.
			if e.fetchAt.UnixNano() > begin.UnixNano() && e.fetchAt.UnixNano() <= end.UnixNano() {
				tmp.addResults(e.results)
			}
		case proto.TopicListRequest_Hot, proto.TopicListRequest_Flame:
			//Hot and Flame is calculated for objects which created in specified term, so exclude objects which is out of range
			tmp.addResultsWithFilter(e.results, func (ent *HotEntry) bool {
				//log.Printf("addResultsWithFilter: %v %v %v %v %v %v", i, ent, begin, end, ent.within(begin, end), yue.DateByUUID(yuep.UUID(ent.id)))
				return ent.within(begin, end)
			})
		}
		//week/alltime: emurate filter on making 12h summery
		if e.fetchAt.UnixNano() == lastFilter.UnixNano() && 
			(typ == proto.TopicListRequest_Week || typ == proto.TopicListRequest_AllTime) {
			log.Printf("emurate filter on summery %v %v %v", lastFilter, getClock(), tmp.total.entries)
			tmp = filterSummery(btyp, tmp)
			log.Printf("emurate filter on summery done %v", tmp.total.entries)
		}
	}

	switch btyp {
	case proto.TopicListRequest_Rising, proto.TopicListRequest_Hot:
		//log.Printf("sort tmp: %v", tmp.total.entries)
		tmp = tmp.sort(btyp).truncate(ENTRY_PER_FETCH)
	case proto.TopicListRequest_Flame:
		tmp = tmp.filter(func (e *HotEntry) bool {
			return e.flamy()
		}).sort(btyp).truncate(ENTRY_PER_FETCH)
		//log.Printf("sort tmp: %v", tmp.total.entries)
	}
	last := int(start+count)
	if last >= len(tmp.total.entries) {
		last = len(tmp.total.entries)
	}
	//log.Printf("estimateResults %v %v %v %v", tmp.total.entries, start, count, last)
	return tmp.total.entries[start:last]

}

func NewTestHotActor(locale string, updateSpan time.Duration, blen []int) (*HotActor, error) {
	return NewHotActorWithDetail(locale, updateSpan, blen, true, testInmemFetcher, testInmemPersister);
}

func TestHotActor(t *testing.T) {
log.Printf("current clock: %v", clock)
	bucketTypes := []proto.TopicListRequest_BucketType {
		proto.TopicListRequest_Rising,
		proto.TopicListRequest_Hot,
		proto.TopicListRequest_Flame,
	}
	queryTypes := []proto.TopicListRequest_QueryType {
		proto.TopicListRequest_Hour,
		proto.TopicListRequest_Day,
		proto.TopicListRequest_Week,
		proto.TopicListRequest_AllTime,
	}
	blen := []int{2, 24}
	// set 4th argument to true for calling update manually.
	a, _ := NewTestHotActor("jp", 1 * time.Second, blen);
	for i := 0; i < ITER_COUNT; i++ {
		addClock()
		a.update(getClock())
		a.updateQueryCache(getClock())
		start, count := 0, 5
		btyp := bucketTypes[rand.Int31n(int32(len(bucketTypes)))]
		var qtypIndex int32
		if btyp == proto.TopicListRequest_Rising {
			//Rising only has Hour and Day
			qtypIndex = rand.Int31n(int32(len(queryTypes) - 2))
		} else {
			qtypIndex = rand.Int31n(int32(len(queryTypes)))			
		}
		typ := queryTypes[qtypIndex]
		log.Printf("iter: %v %v %v", i, btyp, typ)
		entries, err := a.Query(btyp, typ, nil, 0, 0, uint32(count))
		if err != nil {
			t.Fatal(err.Error())
		} else {
			estEntries := estimateResults(btyp, typ, uint64(start), uint64(count))
			log.Printf("check: \n%v\n%v", entries, estEntries)
			if len(entries) != len(estEntries) {
				t.Fatal("entry length differ %v %v", entries, estEntries)
			}
			for i := start; i < len(entries); i++ {
				e := entries[i]
				e2 := estEntries[i]
				if btyp == proto.TopicListRequest_Flame && !e.flamy() {
					t.Fatal("flame query should always return flamy entry %v", e)
				}
				if e.Id != e2.Id || e.Score != e2.Score {
					if e.Id != e2.Id {
						//we believe this is caused by unstableness of sort.Sort, but check next element for confirm.
						if (i + 1) < int(len(estEntries)) {
							e3 := estEntries[i + 1]
							if e.Score == e3.Score && e.Id == e3.Id {
								//log.Printf("id differ because use of unstable sort %v %v", e, e3)
								i++ //next index also same score, so skip check.
								continue
							}
							t.Fatal("result does not match estimated", e, "vs", e2, e3)
						} else if e.Score == e2.Score {
							//last element happen to have same score, we believe this is caused by unstableness of sort.Sort
							continue
						}
					}
					t.Fatal("result does not match estimated", e, "vs", e2)
				}
			}
		}
		time.Sleep(10 * time.Millisecond)
	}
}
