import json
import os
import requests
import subprocess
import tempfile
from uuid import uuid4
from django import forms
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import Http404, HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.http import require_safe, require_POST, require_http_methods

from keywords.models import Keyword, MediaKeyword
from main.elasticsearch import index_media, item_search, get_item_source
from main.item_helpers import delete_item
from main.views.helpers import prepare_media_view_list, LIST_PAGE_SIZE
from mathitems.models import MathItem
from media.models import CindyMedia, Media, SVGImage, ItemMediaDependency
from project.paginator import Paginator, PaginatorError
from project.server_com import parse_cindy, parse_json_relaxed
from userdata.permissions import has_perm, require_perm, Perms

import logging
logger = logging.getLogger(__name__)

SVGO_EXE_PATH = os.path.join(settings.BASE_DIR, './node_modules/.bin/svgo')


@require_safe
def home(request):
    return render(request, 'media/home.html', {
        'title': 'Media',
        'items': prepare_media_view_list(Media.objects.order_by('id')),
        'has_perm_cindy': has_perm(Perms.CINDY, request.user),
    })


def validate_svg(tmpname):
    filename = '{}.svg'.format(uuid4().hex)
    cp = subprocess.run([SVGO_EXE_PATH, '--pretty', tmpname,
                         '-o', os.path.join(settings.MEDIA_ROOT, filename)],
                        stderr=subprocess.PIPE)
    if 'error' in cp.stderr.decode().lower():
        return None
    return SVGImage.objects.create(path=filename)


def request_file_to_temp_file(src):
    with tempfile.NamedTemporaryFile(mode='w+b', prefix='mathitems-', delete=False) as dst:
        for chunk in src.chunks():
            dst.write(chunk)
        return dst.name


@require_POST
@login_required
@require_perm('media')
def image_add(request):
    context = {'title': 'Add Image'}
    if 'ref' in request.POST:
        ref = request.POST['ref']
        format, id_str = ref.split(':')
        if format == SVGImage.REFNAME:
            image = SVGImage.objects.get(id=int(id_str))
        else:
            raise RuntimeError()
        media = Media.objects.create(created_by=request.user)
        image.finalize(media)
        index_media(media)
        return redirect('media-show', media.get_name())
    else:
        tmp_name = request_file_to_temp_file(request.FILES['file'])
        image = validate_svg(tmp_name)
        if image is not None:
            context['ref'] = image.get_ref()
            context['tag'] = image.get_html()
            context['description'] = image.get_description()
        else:
            context['error'] = 'Not a recognized media format'

    return render(request, 'media/image-add.html', context)


class JsonField(forms.CharField):
    def clean(self, value):
        value = super().clean(value)
        try:
            return json.dumps(parse_json_relaxed(value))
        except requests.HTTPError:
            raise forms.ValidationError('Not valid JSON')


class AddCindyForm(forms.Form):
    LATEST_VERSION = '0.8.4'
    version = forms.ChoiceField(choices=[(LATEST_VERSION, LATEST_VERSION)])
    ratio = forms.DecimalField(min_value=10, max_value=1000, initial=75, label='Aspect ratio (100 height/width)')
    create = JsonField(widget=forms.Textarea(attrs={'style': 'height:20em'}), label='Creation data')


def format_create_field(value):
    data = json.loads(value)
    top = []
    for k, v in data.items():
        if type(v) is list:
            value = '[\n' + ',\n'.join('    {}'.format(json.dumps(p)) for p in v) + '\n  ]'
        else:
            value = json.dumps(v)
        top.append('  "{}": {}'.format(k, value))
    return '{\n' + ',\n'.join(top) + '\n}'


@require_http_methods(['GET', 'POST'])
@login_required
@require_perm('media')
def cindy_add(request):
    context = {'title': 'Add Media'}
    if request.method == 'GET':
        form = AddCindyForm()
    elif 'file' in request.FILES:
        tmp_name = request_file_to_temp_file(request.FILES['file'])
        data = parse_cindy(tmp_name)
        create = data['data']
        if 'scripts' in create:
            del create['scripts']
        form_data = {'version': AddCindyForm.LATEST_VERSION}
        if 'ports' in create and type(create['ports']) is list and len(create['ports']) == 1:
            port = create['ports'][0]
            if type(port) is dict:
                try:
                    form_data['ratio'] = str(100.0*int(port['height'])/int(port['width']))
                except (KeyError, ValueError):
                    pass
                for key in ['width', 'height', 'id']:
                    if key in port:
                        del port[key]
        form_data['create'] = format_create_field(json.dumps(create))
        form = AddCindyForm(form_data)
    elif request.POST['submit'] == 'save':
        cindy = CindyMedia.objects.get(pk=int(request.POST['ref']))
        media = Media.objects.create(created_by=request.user)
        cindy.finalize(media)
        index_media(media)
        return redirect('media-show', media.get_name())
    else:
        form = AddCindyForm(request.POST)
        if form.is_valid():
            if 'ref' in request.POST:
                cindy = CindyMedia.objects.get(pk=int(request.POST['ref']))
            else:
                cindy = CindyMedia(path='{}.html'.format(uuid4().hex))
            cindy.version = form.cleaned_data['version']
            cindy.aspect_ratio = form.cleaned_data['ratio']
            cindy.data = '{"create":' + form.cleaned_data['create'] + '}'

            # removes cleaned_data
            form = AddCindyForm(dict(form.cleaned_data,
                                     create=format_create_field(form.cleaned_data['create'])))
            try:
                cindy.create_file()
                cindy.save()
                context['preview'] = cindy
            except Exception as ex:
                context['error'] = str(ex)
            if getattr(cindy, 'id') is not None:
                context['ref'] = cindy.id
    context['form'] = form
    return render(request, 'media/cindy-add.html', context)


@require_safe
def show_media(request, media_str):
    try:
        media = Media.objects.get_by_name(media_str)
    except Media.DoesNotExist:
        raise Http404('Media does not exist')
    return render(request, 'media/show.html', {
        'title': str(media),
        'media': media,
        'keywords': Keyword.objects.filter(mediakeyword__media=media).order_by('name').all(),
        'kw_edit_link': has_perm(Perms.KEYWORD, request.user) and reverse('edit-media-keywords', args=[media.get_name()])
    })


@require_http_methods(['GET', 'POST'])
@login_required
@require_perm('keyword')
def edit_media_keywords(request, id_str):
    try:
        media = Media.objects.get_by_name(id_str)
    except Media.DoesNotExist:
        raise Http404('Item does not exist')
    if request.method == 'POST':
        if 'delete' in request.POST:
            itemkw = MediaKeyword.objects.get(pk=int(request.POST['delete']))
            itemkw.delete()
        else:
            if request.POST['kw']:
                keyword, _ = Keyword.objects.get_or_create(name=request.POST['kw'])
                itemkw, _ = MediaKeyword.objects.get_or_create(
                                media=media, keyword=keyword, defaults={'created_by': request.user})
        index_media(media)
    return render(request, 'media/edit-keywords.html', {
        'title': str(media),
        'media': media,
        'mediakeywords': MediaKeyword.objects.filter(media=media).order_by('keyword__name').all(),
    })


@require_safe
def media_search(request):
    query = request.GET['q']
    try:
        paginator = Paginator(request, LIST_PAGE_SIZE)
        results, total = item_search(query, 'media', paginator.per_page * (paginator.page - 1), paginator.per_page)
        paginator.set_count(total)
    except PaginatorError as pe:
        return redirect(pe.url)

    return render(request, 'media/media-search-page.html', {
        'title': 'Media search',
        'query': query,
        'items': prepare_media_view_list(Media.objects.get_by_name(name) for name in results),
        'paginator': paginator
    })


@require_http_methods(['GET', 'POST'])
def media_meta(request, media_str):
    try:
        media = Media.objects.get_by_name(media_str)
    except Media.DoesNotExist:
        raise Http404('Media does not exist')
    if request.method == 'POST':
        res = delete_item(media)
        return HttpResponse(res, content_type='text/plain')
    else:
        elastic = get_item_source(media_str)
        return render(request, 'media/meta.html', {
            'title': 'Media {}'.format(media.get_name()),
            'elastic': json.dumps(elastic, indent='  '),
            'can_delete': has_perm(Perms.DELETE, request.user) and not ItemMediaDependency.objects.filter(uses=media).exists(),
            'dependents': MathItem.objects.filter(itemmediadependency__uses=media).order_by('id')
        })
