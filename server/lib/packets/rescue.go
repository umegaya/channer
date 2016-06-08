package packets

import (
	"log"

	proto "github.com/umegaya/channer/server/proto"
	"github.com/umegaya/channer/server/lib/models"
)

func ProcessRescue(from Source, msgid uint32, req *proto.RescueRequest, t Transport) {
	a, err := models.FindAccount(models.DBM(), req.Account)
	if err != nil {
		SendError(from, msgid, &proto.Err{ Type: proto.Error_Rescue_DatabaseError })
		return
	}
	if !a.VerifySign(req.Sign, req.Walltime) {
		SendError(from, msgid, &proto.Err{ Type: proto.Error_Rescue_InvalidAuth })
		return 
	}
	res, err := models.NewRescue(models.DBM(), req.Account)
	if err != nil {
		SendError(from, msgid, &proto.Err{ Type: proto.Error_Rescue_DatabaseError })
		return		
	}
	//send post notification to all member in this Topic
	log.Printf("id:%v url:%v", req.Account, res.URL())
	from.Send(&proto.Payload {
		Type: proto.Payload_RescueResponse,
		Msgid: msgid,
		RescueResponse: &proto.RescueResponse{
			Url: res.URL(),
			Remain: res.RemainTime(),
		},
	})
}

