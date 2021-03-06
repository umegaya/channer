package utils

import (
	"net"
	"fmt"
	"log"
	"runtime"
	"strings"
	"strconv"
	"sync"
	"sync/atomic"
)

func INetNtoa(ip string) uint32 {      
    bits := strings.Split(ip, ".")
    
    b0, _ := strconv.Atoi(bits[0])
    b1, _ := strconv.Atoi(bits[1])
    b2, _ := strconv.Atoi(bits[2])
    b3, _ := strconv.Atoi(bits[3])

    var sum uint32
    
    sum += uint32(b0) << 24
    sum += uint32(b1) << 16
    sum += uint32(b2) << 8
    sum += uint32(b3)
    
    return sum
}

//ifip returns IP string of specified interface which name is *name*
func IFIP(name string, need_ipv6 bool) (net.IP, error) {
	i, err := net.InterfaceByName(name)
	if err != nil {
		return nil, err
	}
	l, err := i.Addrs()
	if err != nil {
		return nil, err
	}
	for _, a := range l {
		switch v := a.(type) {
		case *net.IPNet:
			if need_ipv6 == strings.Contains(v.IP.String(), ":") {
				return v.IP, nil
			}
		case *net.IPAddr:
			if need_ipv6 == strings.Contains(v.IP.String(), ":") {
				return v.IP, nil
			}
		}
	}
	return nil, fmt.Errorf("interface %v: no suitable setting found", name)
}

type WaitGroup struct {
	sync.WaitGroup
	errors []error
	cnt int32
}

func NewWaitGroup(size int) *WaitGroup {
	wg := &WaitGroup {
		errors: make([]error, size),
	}
	wg.WaitGroup.Add(size)
	return wg
}

func (wg *WaitGroup) Done(err error) {
	cnt := atomic.AddInt32(&wg.cnt, 1)
	//log.Printf("Done with %v %v", cnt, err)
	wg.errors[cnt - 1] = err
	wg.WaitGroup.Done()
}

func (wg *WaitGroup) Wait() error {
	wg.WaitGroup.Wait()
	var err error
	for i, e := range wg.errors {
		if e != nil && err == nil {
			err = e
		}
		wg.errors[i] = nil
	}
	wg.cnt = 0
	//log.Printf("Wait with %v", err)
	return err
}

//dump system stats
func DumpMemUsage() {
	var mem runtime.MemStats
    runtime.ReadMemStats(&mem)
    log.Println(mem.Alloc)
    log.Println(mem.TotalAlloc)
    log.Println(mem.HeapAlloc)
    log.Println(mem.HeapSys)	
}
