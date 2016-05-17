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
var parentMap map[proto.UUID]proto.UUID = make(map[proto.UUID]proto.UUID)
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
			score := uint32(rand.Int31n(100) + 1)
			entries[i] = FetchResult {
				id: sample.id,
				score: score,
				parent: sample.parent,
				vote: score + uint32(rand.Int31n(int32(score))),
			}
		}
	}
	//make clock backward to assure all generated ids have timestamp before current getClock()
	genClock := getClock().Add(-1 * time.Second)
	for ;i < ENTRY_PER_FETCH; i++ {
		//add new entry
		score := uint32(rand.Int31n(1000) + 1)
		entries[i] = FetchResult {
			id: proto.UUID(node.GenUUID(genClock)),
			score: score,
			parent: proto.UUID(rand.Int31n(50) + 1),
			vote: score + uint32(rand.Int31n(int32(score))),
		}
		parentMap[entries[i].id] = entries[i].parent
	}
	log.Printf("testInmemVoteFetcher: %v", entries)
	estimates = append(estimates, fetchCache {
		fetchAt: getClock(),
		results: entries,
	})
	return entries, nil	
}

func testInmemVoteParentFetcher(start, end time.Time, flame bool) ([]FetchResult, error) {
	tmp := NewHotBucket(ENTRY_PER_FETCH)
	for _, e := range estimates {
		if start.Unix() <= e.fetchAt.Unix() && e.fetchAt.Unix() <= end.Unix() {
			tmp.addResults(e.results)
		}
	}
	if flame {
		tmp = tmp.filter(func (e *HotEntry) bool {
			return e.flamy()
		}).sort().truncate(ENTRY_PER_FETCH)
	} else {
		tmp = tmp.sort().truncate(ENTRY_PER_FETCH)
	}
	ret := make([]FetchResult, len(tmp.total.entries))
	for i, e := range tmp.total.entries {
		ret[i] = FetchResult{ id: e.id, parent: parentMap[e.id], vote: e.vote, score: e.score }
	}
	log.Printf("testInmemVoteParentFetcher: %v", ret)
	return ret, nil
}

func testInmemFetcher(fetchType int, start, end time.Time, locale string) ([]FetchResult, error) {
	switch fetchType {
	case FETCH_FROM_VOTES:
		return testInmemVoteFetcher()
	case FETCH_FROM_CREATED:
		return testInmemVoteParentFetcher(start, end, false)
	case FETCH_FROM_CREATED_FLAME:
		return testInmemVoteParentFetcher(start, end, true)
	default:
		return nil, fmt.Errorf("invalid fetchType: %v", fetchType)
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
	for i := len(estimates) - 1; i >= 0; i-- {
		e := estimates[i]
		if e.fetchAt.UnixNano() <= begin.UnixNano() {
			break
		}
		switch btyp {
		case proto.TopicListRequest_Rising:
			//rising is calculated for votes which is done in specified term. so add all if its in specified term.
			if e.fetchAt.UnixNano() <= end.UnixNano() {
				tmp.addResults(e.results)
			}
		case proto.TopicListRequest_Hot, proto.TopicListRequest_Flame:
			//Hot and Flame is calculated for objects which created in specified term, so exclude objects which is out of range
			tmp.addResultsWithFilter(e.results, func (ent *HotEntry) bool {
				//log.Printf("addResultsWithFilter: %v %v %v %v %v %v", i, ent, begin, end, ent.within(begin, end), yue.DateByUUID(yuep.UUID(ent.id)))
				return ent.within(begin, end)
			})
		}
	}

	switch btyp {
	case proto.TopicListRequest_Rising, proto.TopicListRequest_Hot:
		log.Printf("sort tmp: %v", tmp.total.entries)
		tmp = tmp.sort().truncate(ENTRY_PER_FETCH)
	case proto.TopicListRequest_Flame:
		tmp = tmp.filter(func (e *HotEntry) bool {
			return e.flamy()
		}).sort().truncate(ENTRY_PER_FETCH)
	}
	return tmp.total.entries[start:start+count]

}

/*
func CheckResult(t *testing.T, entries []HotEntry, ids []proto.UUID, start, end uint64, blen []int, endIdx int) {
	summeryCount := 0
	if endIdx >= len(blen) {
		summeryCount = len(estimates)
	} else {
		summeryCount = 0
		for i := 0; i <= endIdx; i++ {
			if i > 0 {
				summeryCount = summeryCount * blen[i]
			} else {
				summeryCount = blen[0]
			}
		}
	}
	est := NewHotBucket(int(ENTRY_PER_FETCH * summeryCount))
	summeryStart := len(estimates) - summeryCount
	if summeryStart < 0 {
		summeryStart = 0
	}
	for _, r := range estimates[summeryStart:] {
		est.addResults(r)
	}
	est.sort()
	estEntries, err := est.rangeOf(ids, start, end + 1)
	if err != nil {
		t.Fatal(err.Error())
	}
	//log.Printf("check: %v %v %v\n%v\n%v", len(estimates), summeryCount, endIdx, entries, estEntries)
	for i := start; i < (start + end); i++ {
		e := entries[i]
		e2 := estEntries[i]
		if e.id != e2.id || e.score != e2.score {
			if e.id != e2.id && (i + 1) < uint64(len(estEntries)) {
				e3 := estEntries[i + 1]
				if e.score == e3.score && e.id == e3.id {
					//log.Printf("id differ because use of unstable sort %v %v", e, e3)
					i++ //next index also same score, so skip check.
					continue
				}
				t.Fatal("result does not match estimated", e, "vs", e2, e3)
			}
			t.Fatal("result does not match estimated", e, "vs", e2)
		}
	}
}
*/

func NewTestHotActor(locale string, spanSec uint32, blen []int) (*HotActor, error) {
	return NewHotActorWithDetail(locale, spanSec, blen, true, testInmemFetcher, testInmemPersister);
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
	a, _ := NewTestHotActor("jp", 1, blen);
	for i := 0; i < ITER_COUNT; i++ {
		addClock()
		a.update(getClock())
		a.updateQueryCache(getClock())
		start, end := 0, 5
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
		entries, err := a.Query(btyp, typ, nil, uint64(start), uint64(end))
		if err != nil {
			t.Fatal(err.Error())
		} else {
			estEntries := estimateResults(btyp, typ, uint64(start), uint64(end))
		log.Printf("check: \n%v\n%v", entries, estEntries)
			for i := start; i < (start + end); i++ {
				e := entries[i]
				e2 := estEntries[i]
				if btyp == proto.TopicListRequest_Flame && !e.flamy() {
					t.Fatal("flame query should always return flamy entry %v", e)
				}
				if e.id != e2.id || e.score != e2.score {
					if e.id != e2.id {
						//we believe this is caused by unstableness of sort.Sort, but check next element for confirm.
						if (i + 1) < int(len(estEntries)) {
							e3 := estEntries[i + 1]
							if e.score == e3.score && e.id == e3.id {
								//log.Printf("id differ because use of unstable sort %v %v", e, e3)
								i++ //next index also same score, so skip check.
								continue
							}
							t.Fatal("result does not match estimated", e, "vs", e2, e3)
						} else if e.score == e2.score {
							//last element happen to have same score, we believe this is caused by unstableness of sort.Sort
							continue
						}
					}
					t.Fatal("result does not match estimated", e, "vs", e2)
				}
			}
		}
		/*} else if typ == proto.TopicListRequest_Hour {
			CheckResult(t, entries, nil, uint64(start), uint64(end), blen, 0)
		} else if typ == proto.TopicListRequest_Day {
			CheckResult(t, entries, nil, uint64(start), uint64(end), blen, 1)
		} else if typ == proto.TopicListRequest_AllTime {
			CheckResult(t, entries, nil, uint64(start), uint64(end), blen, 2)
		}*/
		time.Sleep(10 * time.Millisecond)
	}
}
