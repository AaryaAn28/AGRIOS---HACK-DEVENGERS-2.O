import urllib.request
import json

# 1. Register Agronomist
req1 = urllib.request.Request(
    'http://127.0.0.1:8000/api/auth/register-subordinate',
    data=json.dumps({
        'role': 'agronomist',
        'full_name': 'Dr. Amanpreet Kaur',
        'jurisdiction_code': 'Punjab Ludhiana North',
        'email': 'amanpreet@agrios.in'
    }).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res1 = json.loads(urllib.request.urlopen(req1).read())
print('1. Created Agronomist:', res1['persona_code'], '| Name:', res1['full_name'], '| Onboarding:', res1['has_completed_onboarding'])

# 2. Walk & Calibrate Farm
req2 = urllib.request.Request(
    'http://127.0.0.1:8000/api/farms/walk-and-calibrate',
    data=json.dumps({
        'agronomist_id': res1['id'],
        'farm_name': 'Amanpreet Model Bio Farm',
        'area_acres': 18.5,
        'crop_type': 'Wheat',
        'target_duration_days': 120
    }).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res2 = json.loads(urllib.request.urlopen(req2).read())
print('2. Calibrated Farm:', res2['farm_name'], '| Twin Version:', res2['structure']['version_number'], '| Crop Plan Stages:', len(res2['crop_plan']['stages']))

# 3. Activate Crop Plan & Release Stage 1 Tasks
req3 = urllib.request.Request(
    f"http://127.0.0.1:8000/api/crop-plans/farm/{res2['farm_id']}/activate",
    data=json.dumps(res2['crop_plan']).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res3 = json.loads(urllib.request.urlopen(req3).read())
print('3. Activated Crop Plan:', res3['message'])
print('   Dispatched Stage 1 Tasks:', res3['dispatched_tasks'])

# 4. Register Farmer and Worker
req4 = urllib.request.Request(
    'http://127.0.0.1:8000/api/auth/register-subordinate',
    data=json.dumps({
        'role': 'farmer',
        'full_name': 'Gurpreet Singh',
        'jurisdiction_code': 'Punjab Ludhiana North',
        'farm_id': res2['farm_id'],
        'registered_by_id': res1['id']
    }).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res4 = json.loads(urllib.request.urlopen(req4).read())
print('4. Created Farmer:', res4['persona_code'], '| Name:', res4['full_name'])

req5 = urllib.request.Request(
    'http://127.0.0.1:8000/api/auth/register-subordinate',
    data=json.dumps({
        'role': 'worker',
        'full_name': 'Manjit Kaur',
        'jurisdiction_code': 'Punjab Ludhiana North',
        'farm_id': res2['farm_id'],
        'registered_by_id': res1['id']
    }).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res5 = json.loads(urllib.request.urlopen(req5).read())
print('5. Created Worker:', res5['persona_code'], '| Name:', res5['full_name'])

# 6. Verify Quick Personas on login screen
res6 = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/auth/quick-personas').read())
print('6. Quick Personas on Login Screen count:', len(res6))
for p in res6:
    print(f"   - [{p.get('persona_code') or p['role'].upper()}] {p['full_name']} ({p['email']})")
