from django.shortcuts import render, get_object_or_404
from django.views.decorators.http import require_POST, require_safe, require_http_methods
from django.http import HttpResponseRedirect, Http404
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.contrib import messages
from django import forms
from main.helpers import init_context, datetime_user_string
from items.models import Item
from items.helpers import prepare_tags, prepare_body, typeset_body, typeset_tag, make_short_name
from users.helpers import get_user_info

import logging
logger = logging.getLogger(__name__)

class EditItemForm(forms.Form):
    body        = forms.CharField(widget=forms.Textarea(attrs={'class': 'body'}), required=False)
    primarytags = forms.CharField(widget=forms.Textarea(attrs={'class': 'tags'}), required=False)
    othertags   = forms.CharField(widget=forms.Textarea(attrs={'class': 'tags'}), required=False)

@login_required
@require_http_methods(["GET", "POST"])
def new(request, kind):
    c = init_context(request)
    if request.method == 'GET':
        form = EditItemForm()
    else:
        form = EditItemForm(request.POST)
        if form.is_valid():
            item_messages = []
            primary_tag_list = form.cleaned_data['primarytags'].splitlines()
            other_tag_list   = form.cleaned_data['othertags'].splitlines()
            tags = prepare_tags(primary_tag_list, other_tag_list, item_messages)
            body = prepare_body(form.cleaned_data['body'], item_messages)
            if request.POST['submit'].lower() == 'save':
                if item_messages:
                    for im in item_messages:
                        messages.error(request, im)
                else:
                    item_id = Item.objects.add_item(request.user, kind, body, tags)
                    message = '%s %s successfully created' % (kind.capitalize(), str(item_id))
                    logger.debug(message)
                    messages.success(request, message)
                    return HttpResponseRedirect(reverse('items.views.show', args=[item_id]))
            else:  # preview
                c['preview'] = { 'body':         typeset_body(body),
                                 'primary_tags': [typeset_tag(t[0]) for t in tags if t[1]],
                                 'other_tags':   [typeset_tag(t[0]) for t in tags if not t[1]] }
                if item_messages:
                    for im in item_messages:
                        messages.warning(request, im)
    c.update({ 'kind': kind,
               'form': form })
    return render(request, 'items/new.html', c)

@login_required
@require_http_methods(["GET", "POST"])
def edit(request, item_id):
    c = init_context(request)
    item = get_object_or_404(Item, pk=item_id)
    own_item = request.user.is_authenticated() and request.user.id == item.created_by.id
    if not (item.status == 'D' and own_item):
        raise Http404
    if request.method == 'GET':
        tags = [(itemtag.tag.name, itemtag.primary)
                for itemtag in item.itemtag_set.all()]
        form = EditItemForm({ 'body':        item.body,
                              'primarytags': '\n'.join([t[0] for t in tags if t[1]]),
                              'othertags':   '\n'.join([t[0] for t in tags if not t[1]])})
    else:
        form = EditItemForm(request.POST)
        if form.is_valid():
            item_messages = []
            primary_tag_list = request.POST['primarytags'].splitlines()
            other_tag_list   = request.POST['othertags'].splitlines()
            tags = prepare_tags(primary_tag_list, other_tag_list, item_messages)
            body = prepare_body(request.POST['body'], item_messages)
            if request.POST['submit'].lower() == 'update':
                if item_messages:
                    for im in item_messages:
                        messages.error(request, im)
                else:
                    Item.objects.update_item(item, request.user, body, tags)
                    message = '%s %s successfully update' % (item.get_kind_display().capitalize(), str(item_id))
                    logger.debug(message)
                    messages.success(request, message)
                    return HttpResponseRedirect(reverse('items.views.show', args=[item_id]))
            else:  # preview
                c['preview'] = { 'body':         typeset_body(body),
                                 'primary_tags': [typeset_tag(t[0]) for t in tags if t[1]],
                                 'other_tags':   [typeset_tag(t[0]) for t in tags if not t[1]] }
                if item_messages:
                    for im in item_messages:
                        messages.warning(request, im)
    c.update({ 'id':   item_id,
               'kind': item.get_kind_display(),
               'form': form })
    return render(request, 'items/edit.html', c)

@require_safe
def show(request, item_id):
    c = init_context(request)
    item = get_object_or_404(Item, pk=item_id)
    own_item = request.user.is_authenticated() and request.user.id == item.created_by.id
    if not ((item.status == 'D' and own_item) or item.status == 'R'):
        raise Http404 
    tags = [(typeset_tag(itemtag.tag.name), itemtag.primary)
            for itemtag in item.itemtag_set.all()]
    c['id']           = item_id
    c['kind']         = item.get_kind_display()
    c['status']       = item.get_status_display()
    c['modified_by']  = get_user_info(item.modified_by)
    c['modified_at']  = datetime_user_string(request.user, item.modified_at)
    c['body']         = typeset_body(item.body)
    c['primary_tags'] = [t[0] for t in tags if t[1]]
    c['other_tags']   = [t[0] for t in tags if not t[1]]
    c['own_item']     = own_item
    return render(request, 'items/show.html', c)

@require_safe
def show_final(request, final_id):
    c = init_context(request)
    item = get_object_or_404(Item, final_id=final_id)
    tags = [(typeset_tag(itemtag.tag.name), itemtag.primary)
            for itemtag in item.itemtag_set.all()]
    c['final_id']     = final_id
    c['kind']         = item.get_kind_display()
    c['created_by']   = get_user_info(item.created_by)
    c['published_at'] = datetime_user_string(request.user, item.final_at)
    c['body']         = typeset_body(item.body)
    c['primary_tags'] = [t[0] for t in tags if t[1]]
    c['other_tags']   = [t[0] for t in tags if not t[1]]
    return render(request, 'items/show_final.html', c)

@login_required
@require_POST
def change_status(request):
    item_id = request.POST['item']
    item = get_object_or_404(Item, pk=item_id)
    own_item = request.user.is_authenticated() and request.user.id == item.created_by.id
    if request.POST['status'] == 'publish':
        if not own_item or item.status not in ['D', 'R', 'F']:
            raise Http404 
        if item.status != 'F':
            item.make_final(request.user)
        return HttpResponseRedirect(reverse('items.views.show_final', args=[item.final_id]))
    else:
        # TODO
        raise Http404
