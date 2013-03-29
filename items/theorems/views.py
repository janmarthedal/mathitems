from django.shortcuts import render
from django.views.decorators.http import require_safe, require_http_methods
from django.core.urlresolvers import reverse
from items.models import FinalItem
from items.helpers import item_search
from main.helpers import init_context


@require_safe
def index(request):
    c = init_context('theorems')
    c['finalitems'] = list(FinalItem.objects.filter(itemtype='T', status='F').order_by('-created_at')[:5])
    return render(request, 'theorems/index.html', c) 


@require_http_methods(["GET", "POST"])
def search(request):
    c = item_search(request, 'T')
    c['itemtype'] = 'theorem'
    c['selfurl'] = reverse('items.theorems.views.search') 
    return render(request, 'items/search.html', c) 
