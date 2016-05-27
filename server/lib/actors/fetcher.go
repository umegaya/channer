package actors

import (
	"fmt"
	"database/sql"
	"time"

	"github.com/umegaya/channer/server/lib/models"
	proto "github.com/umegaya/channer/server/proto"

	"github.com/umegaya/yue"
)

var FLAME_THRESHOLD float64 = 0.1
var FLAME_VOTE_THRESHOLD uint32 = 10

func topicFetcher(fetchType int, start, end time.Time, locale string) ([]FetchResult, error) {
	entries := make([]FetchResult, DEFAULT_HOTBUCKET_SIZE)
	dbm := models.DBM()
	var rows *sql.Rows
	var err error
	locale_clause := ""
	if len(locale) > 0 {
		locale_clause = fmt.Sprintf("and locale = '%s'", locale)
	}
	switch fetchType {
	case FETCH_FROM_VOTES:
		where_clause := fmt.Sprintf("created >= %v and created < %v %s", yue.UUIDAt(start), yue.UUIDAt(end), locale_clause)
		rows, err = dbm.Query(
			dbm.Stmt(
				`select id,max(parent) as channel,sum(param) as point,count(persona) as vote from %s.reactions where %s and type = $1 group by id`, 
			where_clause), 
		proto.Model_Reaction_Topic_Vote)
	case FETCH_FROM_CREATED:
		where_clause := fmt.Sprintf("id >= %v and id < %v %s", yue.UUIDAt(start), yue.UUIDAt(end), locale_clause)
		rows, err = dbm.Query(
			dbm.Stmt(
				`select id,channel,point,vote from %s.topics where %s order by point desc limit %v`, 
			where_clause, len(entries)))
	case FETCH_FROM_CREATED_FLAME:
		/*
		u: upvote, d: downvote, v: vote, p: point
		u + d = v
		u - d = p

		u = (v + p) / 2
		d = (v - p) / 2

		u / v => (1 + p / v) / 2

		abs(u / v - 0.5) = abs(p / (2 * v)) < threshold => abs(p / v) < 2 * threshold
		*/
		where_clause := fmt.Sprintf("id >= %v and id < %v %s", yue.UUIDAt(start), yue.UUIDAt(end), locale_clause)
		rows, err = dbm.Query(
			dbm.Stmt(
				`select id,channel,point,vote from %s.topics where %s and vote < %v and abs(point / vote) < %v order by vote desc limit %v`, 
			where_clause, FLAME_VOTE_THRESHOLD, FLAME_THRESHOLD * 2, len(entries)))
	default:
		return nil, fmt.Errorf("invalid fetchType: %v", fetchType)
	}

	if err != nil {
		return nil, err
	}
	i := 0
	for rows.Next() {
		if cap(entries) <= len(entries) {
			tmp := make([]FetchResult, 2 * len(entries))
			entries = append(tmp, entries...)
		}
		if err := rows.Scan(&entries[i].id, &entries[i].parent, &entries[i].score, &entries[i].vote); err != nil {
			return nil, err
		}
		i++
	}
	return entries, nil
}

func topicPersister(at time.Time, s *hotbucketStore) error {
	return nil
}