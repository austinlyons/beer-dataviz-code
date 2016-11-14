import requests
import json

def get_distinct_beers():
    URL = 'https://api.untappd.com/v4/user/beers/austinlyons'
    CLIENT_ID = 'YOUR_UNTAPPD_ID_HERE'
    CLIENT_SECRET = 'YOUR_UNTAPPD_SECRET_HERE'
    STEP = 50
    payload = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'limit': STEP,
    }
    beers = []
    offset = 0
    while True:
        payload['offset'] = offset
        print('attempting to fetch {} - {}'.format(offset, offset + STEP))
        json = requests.get(URL, params=payload).json()
        data = json['response']['beers']
        beers.extend(data['items'])
        offset += STEP
        if data['count'] == 0 or data['count'] < STEP:
            break

    print('fetched data for {} beers'.format(len(beers)))
    return beers


def save_to_json(beers):
    print('saving to beers.json')
    with open('beers.json', 'w') as outfile:
        json.dump({'beers': beers}, outfile)


if __name__ == '__main__':
    beers = get_distinct_beers()
    save_to_json(beers)
