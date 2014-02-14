from urllib.parse import unquote
from django.core.urlresolvers import reverse
from django.shortcuts import render, Http404
from django.views.decorators.http import require_safe
from items.helpers import item_search_to_json
from main.helpers import init_context
from tags.models import Category

import logging
logger = logging.getLogger(__name__)

def category_link_from_tags(tags):
    return reverse('tags.views.browse', args=['/'.join(tags)])

def path_to_category_items(path):
    tags = path.split('/') if path else []
    return [{'name': tags[i], 'link': category_link_from_tags(tags[0:i])} for i in range(0, len(tags))]

@require_safe
def browse(request, path):
    category_items = path_to_category_items(path)
    tags = path.split('/') if path else []
    category = Category.objects.from_tag_names_or_404(tags)
    listing = Category.objects.filter(parent=category).order_by('tag__name').values_list('tag__name', flat=True)
    result_list = [{'name': name, 'link': category_link_from_tags(tags + [name])} for name in listing]
    c = init_context('categories', category_items=category_items, result_list=result_list, path = path)
    return render(request, 'tags/browse.html', c)

@require_safe
def list_definitions(request, path):
    if not path:
        raise Http404
    category_items = path_to_category_items(path)
    tags = map(unquote, path.split('/'))
    logger.debug(tags)
    category = Category.objects.from_tag_names_or_404(tags)
    c = init_context('definitions', category_items=category_items, category=category.pk,
                     init_items=item_search_to_json(itemtype='D', category=category))
    return render(request, 'tags/list_definitions.html', c)
