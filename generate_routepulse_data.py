import json, random
from datetime import datetime, timedelta
from pathlib import Path

rng = random.Random(42)
out = Path(__file__).resolve().parent
out.mkdir(parents=True, exist_ok=True)

stop_names = [
    'North Hostel','East Hostel','West Hostel','South Hostel','Engineering Block','Science Block','Central Library','Admin Building',
    'Main Gate','East Gate','West Gate','Medical Centre','Cafeteria','Sports Complex','Research Park','Auditorium','Student Centre',
    'Girls Hostel','Boys Hostel','Parking A','Parking B','Management Block','Computer Centre','Workshop','Innovation Hub','Pharmacy Block',
    'Law School','Arts Block','Commerce Block','Central Store','Guest House','Faculty Housing','Transit Hub','Stadium','Swimming Pool',
    'North Parking','South Parking','Incubation Centre','Lecture Hall A','Lecture Hall B'
]
stops=[]
for i,name in enumerate(stop_names,1):
    row,col=divmod(i-1,8)
    stops.append({'stopId':f'S{i:02d}','name':name,
      'latitude':round(21.1400+row*0.0021+rng.uniform(-0.00035,0.00035),6),
      'longitude':round(79.0480+col*0.0017+rng.uniform(-0.00035,0.00035),6),
      'accessible':name not in {'Sports Complex','Workshop','Swimming Pool'},
      'zone':['North','Central','South','East','West'][i%5]})

route_names=['Hostel–Academic Loop','East Campus Connector','Gate–Research Express','Residential Shuttle','Library–Lecture Loop','Medical–Admin Link','Sports and Recreation','Research Park Connector','Campus Circular','Outer Campus Shuttle']
routes=[]
for r in range(10):
    start=(r*3)%len(stops); count=5+(r%2)
    ids=[stops[(start+j*(1+r%3))%len(stops)]['stopId'] for j in range(count)]
    if len(set(ids))<len(ids): ids=[stops[(start+j)%len(stops)]['stopId'] for j in range(count)]
    routes.append({'routeId':f'R{r+1:02d}','name':route_names[r],'stopIds':ids,
      'distanceKm':round(3.2+r*0.42+rng.uniform(0.1,0.8),1),
      'estimatedDurationMin':15+(r%5)*3+rng.randint(0,4),
      'serviceWindow':{'start':'07:00','end':'22:00'},'minimumHeadwayMin':20 if r<4 else 30})

vehicles=[]
for i in range(1,26):
    active=i<=20
    vehicles.append({'vehicleId':f'BUS{i:02d}','capacity':rng.choice([25,30,35,40,45,50]),
      'accessible':i%4!=0,'available':True,'status':'active' if active else 'standby',
      'assignedRouteId':routes[(i-1)%len(routes)]['routeId'] if active else None,
      'operatingCostPerKm':round(rng.uniform(18,32),2),'turnaroundBufferMin':5})
route_vehicle={r['routeId']:vehicles[i]['vehicleId'] for i,r in enumerate(routes)}
service_date=datetime(2026,10,15)
time_windows=[(7,0),(7,20),(7,40),(8,0),(8,20),(8,40),(9,0),(10,0),(11,0),(12,0),(13,0),(14,0),(15,0),(16,0),(16,30),(17,0),(17,30),(18,0),(19,0),(20,0)]
schedules=[]; demand=[]; etas=[]; gps=[]
trip_no=1
for route in routes:
    for hour,minute in time_windows:
        dep=service_date.replace(hour=hour,minute=minute)
        dur=route['estimatedDurationMin']
        stop_times=[]
        for idx,stop_id in enumerate(route['stopIds']):
            arrival=dep+timedelta(minutes=round(dur*idx/(len(route['stopIds'])-1)))
            stop_times.append({'stopId':stop_id,'arrivalTime':arrival.isoformat(timespec='minutes')})
        schedules.append({'tripId':f'T{trip_no:04d}','routeId':route['routeId'],'vehicleId':route_vehicle[route['routeId']],
          'departureTime':dep.isoformat(timespec='minutes'),'stopTimes':stop_times,'status':'scheduled','serviceDate':service_date.date().isoformat()})
        trip_no+=1
for route in routes:
    for hour,minute in time_windows:
        label=f'{hour:02d}:{minute:02d}'
        peak=1.8 if label in {'07:00','07:20','07:40','08:00','08:20','08:40'} else (1.45 if label in {'16:00','16:30','17:00','17:30','18:00'} else 0.75)
        for idx,stop_id in enumerate(route['stopIds'][:-1]):
            passengers=max(0,round(rng.randint(3,28)*peak))
            destination=route['stopIds'][rng.randint(idx+1,len(route['stopIds'])-1)]
            demand.append({'demandId':f'D{len(demand)+1:05d}','routeId':route['routeId'],'stopId':stop_id,
              'timeWindow':label,'passengers':passengers,'destinationStopId':destination,'weekday':'Thursday','eventFactor':1.0})
stop_lookup={s['stopId']:s for s in stops}
for sch in schedules:
    trip_delay=rng.choice([0,0,1,2,3,5,8])
    for st in sch['stopTimes']:
        planned=datetime.fromisoformat(st['arrivalTime'])
        actual=planned+timedelta(minutes=max(0,trip_delay+rng.choice([-2,-1,0,0,1,2])))
        estimate=actual+timedelta(minutes=rng.choice([-3,-2,-1,0,0,1,2,3]))
        etas.append({'tripId':sch['tripId'],'vehicleId':sch['vehicleId'],'routeId':sch['routeId'],'stopId':st['stopId'],
          'scheduledArrival':planned.isoformat(timespec='minutes'),'estimatedArrival':estimate.isoformat(timespec='minutes'),
          'groundTruthArrival':actual.isoformat(timespec='minutes'),
          'arrivalWindowStart':(estimate-timedelta(minutes=2)).isoformat(timespec='minutes'),
          'arrivalWindowEnd':(estimate+timedelta(minutes=3)).isoformat(timespec='minutes')})
        stop=stop_lookup[st['stopId']]
        for mins_before in [8,5,2,0]:
            gps.append({'tripId':sch['tripId'],'vehicleId':sch['vehicleId'],
              'timestamp':(actual-timedelta(minutes=mins_before)).isoformat(timespec='minutes'),
              'latitude':round(stop['latitude']+rng.uniform(-0.0007,0.0007),6),
              'longitude':round(stop['longitude']+rng.uniform(-0.0007,0.0007),6),
              'nearestStopId':st['stopId'],'sampleType':'synthetic'})
scenarios=[
 {'scenarioId':'SCN01','name':'Normal Operations','type':'normal','startTime':'07:00','endTime':'20:00','travelTimeMultiplier':1.0,'demandMultiplier':1.0,'unavailableVehicleIds':[]},
 {'scenarioId':'SCN02','name':'Morning Traffic Delay','type':'traffic_delay','startTime':'07:30','endTime':'09:00','affectedRouteIds':['R01','R02','R05'],'travelTimeMultiplier':1.35,'demandMultiplier':1.0,'unavailableVehicleIds':[]},
 {'scenarioId':'SCN03','name':'Main Gate Road Closure','type':'road_closure','startTime':'08:00','endTime':'10:00','affectedStopIds':['S09'],'affectedRouteIds':['R03','R09'],'travelTimeMultiplier':1.5,'demandMultiplier':1.0,'unavailableVehicleIds':[]},
 {'scenarioId':'SCN04','name':'Demand Surge After Event','type':'demand_surge','startTime':'16:00','endTime':'18:00','affectedStopIds':['S14','S34'],'travelTimeMultiplier':1.0,'demandMultiplier':1.8,'unavailableVehicleIds':[]},
 {'scenarioId':'SCN05','name':'Vehicle Breakdown','type':'vehicle_unavailable','startTime':'08:00','endTime':'12:00','travelTimeMultiplier':1.0,'demandMultiplier':1.0,'unavailableVehicleIds':['BUS02']}
]
alerts=[]; vehicle_by_id={v['vehicleId']:v for v in vehicles}
for d in demand:
    vid=route_vehicle[d['routeId']]; cap=vehicle_by_id[vid]['capacity']
    if d['passengers']>cap:
        alerts.append({'alertId':f'A{len(alerts)+1:05d}','type':'overcapacity','severity':'high','routeId':d['routeId'],
          'stopId':d['stopId'],'timeWindow':d['timeWindow'],'passengers':d['passengers'],'vehicleId':vid,'capacity':cap,
          'message':f"Demand {d['passengers']} exceeds {vid} capacity {cap}."})
for e in etas:
    delay=int((datetime.fromisoformat(e['groundTruthArrival'])-datetime.fromisoformat(e['scheduledArrival'])).total_seconds()//60)
    if delay>=5:
        alerts.append({'alertId':f'A{len(alerts)+1:05d}','type':'delay','severity':'high' if delay>=8 else 'medium',
          'routeId':e['routeId'],'vehicleId':e['vehicleId'],'stopId':e['stopId'],'delayMinutes':delay,
          'message':f"{e['vehicleId']} is {delay} minutes late at {e['stopId']}."})
errors=[abs((datetime.fromisoformat(e['estimatedArrival'])-datetime.fromisoformat(e['groundTruthArrival'])).total_seconds()/60) for e in etas]
on_time=sum(abs((datetime.fromisoformat(e['groundTruthArrival'])-datetime.fromisoformat(e['scheduledArrival'])).total_seconds()/60)<=5 for e in etas)
summary={'activeVehicles':sum(v['status']=='active' for v in vehicles),'totalRoutes':len(routes),'totalDemand':sum(d['passengers'] for d in demand),
 'overcapacityAlerts':sum(a['type']=='overcapacity' for a in alerts),'averageWaitingTime':None,
 'averageWaitingTimeNote':'Not calculated: true waiting time requires passenger arrival-time observations.',
 'meanEtaAbsoluteErrorMinutes':round(sum(errors)/max(1,len(errors)),2),'onTimePercentage':round(100*on_time/max(1,len(etas)),2),
 'totalTrips':len(schedules),'totalStops':len(stops),'totalGpsSamples':len(gps),'totalDemandRecords':len(demand),
 'totalAlerts':len(alerts),'totalDisruptionScenarios':len(scenarios)}
dataset={'metadata':{'project':'RoutePulse','description':'Expanded synthetic campus transport dataset. Coordinates, demand, GPS traces, and times are illustrative, not live data.',
 'randomSeed':42,'serviceDate':service_date.date().isoformat(),'units':{'distance':'km','time':'ISO 8601 local datetime','passengers':'people','cost':'illustrative currency units'},'version':'2.0'},
 'routes':routes,'stops':stops,'vehicles':vehicles,'schedules':schedules,'demand':demand,'etas':etas,'gpsTraces':gps,
 'scenarios':scenarios,'summary':summary,'alerts':alerts}
json_path=out/'routepulse_synthetic_data.json'
json_path.write_text(json.dumps(dataset,indent=2,ensure_ascii=False),encoding='utf-8')

# Also write the reusable generator to the requested folder by copying this generator itself.
generator_path=out/'generate_routepulse_data.py'
generator_source=Path('/tmp/create_routepulse.py').read_text(encoding='utf-8')
# Replace fixed output path with script-relative output directory for portable use.
generator_source=generator_source.replace("out = Path(__file__).resolve().parent", "out = Path(__file__).resolve().parent")
generator_path.write_text(generator_source,encoding='utf-8')

# Validate JSON parses and report sizes/counts.
check=json.loads(json_path.read_text(encoding='utf-8'))
print('JSON_PATH',json_path)
print('GENERATOR_PATH',generator_path)
print('COUNTS',json.dumps({k:len(check[k]) for k in ['routes','stops','vehicles','schedules','demand','etas','gpsTraces','scenarios','alerts']}))
print('SUMMARY',json.dumps(check['summary']))
print('JSON_BYTES',json_path.stat().st_size,'SCRIPT_BYTES',generator_path.stat().st_size)
