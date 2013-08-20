from django.contrib import messages
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, Http404
from django.shortcuts import render, get_object_or_404
from django.views.decorators.http import require_POST, require_GET
from drafts.models import DraftItem
from items.models import FinalItem
from main.helpers import init_context, logged_in_or_404
from analysis.management.commands.analyze import add_final_item_dependencies, check_final_item_tag_categories

import logging
logger = logging.getLogger(__name__)

def get_user_draft_permissions(user, item):
    own_item = user == item.created_by
    return {
        'view':       (item.status == 'D' and own_item) or item.status == 'R',
        'edit':       item.status == 'D' and own_item,
        'to_draft':   item.status == 'R' and own_item,
        'to_review':  item.status == 'D' and own_item,
        'to_final':   item.status in ['D', 'R'] and own_item
    }

@require_GET
def new(request, kind, parent=None):
    if not request.user.is_authenticated():
        messages.info(request, "You must be logged in to create a " + kind)
        return HttpResponseRedirect(reverse('users.views.login') + '?next=' + request.path)
    c = init_context(kind)
    if parent:
        if kind != 'proof':
            raise Http404
        c['parent'] = get_object_or_404(FinalItem, final_id=parent, itemtype='T')
    c['kind'] = kind
    if kind == 'definition':
        c['primary_text'] = 'Terms defined'
    elif kind == 'theorem':
        c['primary_text'] = 'Name(s) for theorem'
    return render(request, 'drafts/new_draft.html', c)

@require_GET
def show(request, item_id):
    item = get_object_or_404(DraftItem, pk=item_id)
    permissions = get_user_draft_permissions(request.user, item)
    if not permissions['view']:
        raise Http404
    c = { 'item': item,
          'perm': permissions }
    return render(request, 'drafts/show_draft.html', c)

@logged_in_or_404
@require_GET
def edit(request, item_id):
    item = get_object_or_404(DraftItem, pk=item_id)
    item_perms = get_user_draft_permissions(request.user, item)
    if not item_perms['edit']:
        raise Http404
    c = init_context(item.itemtype)
    c['item'] = item
    if item.itemtype == 'D':
        c['primary_text'] = 'Terms defined'
    elif item.itemtype == 'T':
        c['primary_text'] = 'Name(s) of theorem'
    return render(request, 'drafts/edit_draft.html', c)

@logged_in_or_404
@require_POST
def delete_draft(request, item_id):
    item = get_object_or_404(DraftItem, pk=item_id)
    if request.user != item.created_by:
        raise Http404
    item.delete()
    return HttpResponseRedirect(reverse('users.views.profile', args=[request.user.get_username()]))

@logged_in_or_404
@require_POST
def to_review(request, item_id):
    item = get_object_or_404(DraftItem, pk=item_id)
    if request.user == item.created_by and item.status == 'D':
        item.make_review()
        return HttpResponseRedirect(reverse('items.views.show', args=[item.id]))
    raise Http404

@logged_in_or_404
@require_POST
def to_final(request, item_id):
    item = get_object_or_404(DraftItem, pk=item_id)

    if request.user != item.created_by or item.status not in ['D', 'R']:
        raise Http404

    fitem = FinalItem.objects.add_item(item)

    add_final_item_dependencies(fitem)
    check_final_item_tag_categories(fitem)

    item.delete()
    return HttpResponseRedirect(reverse('items.views.show_final', args=[fitem.final_id]))