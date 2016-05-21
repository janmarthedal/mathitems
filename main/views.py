import requests
from django.shortcuts import render

test_body = r"""The $n$th [harmonic number](=harmonic-number), $H_n$, is defined as

$$
H_n = 1 + \frac{1}{2} + \ldots + \frac{1}{n} = \sum_{k=1}^n \frac{1}{k}
$$

for $n \geq 1$."""

def node_request(path, payload):
    r = requests.post('http://localhost:3000' + path, json=payload)
    r.raise_for_status()
    return r.json()

def new_item(request):
    context = {'title': 'New Item'}
    if request.method == 'POST':
        body = request.POST['src']
        item_data = node_request('/prepare-item', {'text': body})
        data = node_request('/render-item', item_data)
        context['item_html'] = data['html']
        context['body'] = body
    else:
        context['body'] = test_body
    return render(request, 'main/new-item.html', context)
