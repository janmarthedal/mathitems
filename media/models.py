from datetime import datetime, timedelta
import json
from os import path
from shutil import move

from django.conf import settings
from django.db import models
from django.template.loader import render_to_string
from django.urls import reverse

from mathitems.models import MathItem


class MediaManager(models.Manager):
    def get_by_name(self, name):
        if name[0] != 'M':
            raise Media.DoesNotExist()
        return self.get(id=int(name[1:]))


class Media(models.Model):
    objects = MediaManager()

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'media'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._main_image = None

    def get_name(self):
        return 'M{}'.format(self.id)

    def __str__(self):
        return 'Media {}'.format(self.get_name())

    def get_absolute_url(self):
        return reverse('media-show', args=[self.get_name()])

    def _get_main_image(self):
        if not self._main_image:
            images = self.svgimage_set.all()
            if images:
                self._main_image = images[0]
            else:
                images = self.cindymedia_set.all()
                if images:
                    self._main_image = images[0]
        return self._main_image

    def get_html(self):
        return self._get_main_image().get_html()

    def get_description(self):
        return self._get_main_image().get_description()


class ItemMediaDependency(models.Model):
    item = models.ForeignKey(MathItem, on_delete=models.CASCADE)
    uses = models.ForeignKey(Media, on_delete=models.CASCADE)

    class Meta:
        db_table = 'item_media_deps'
        unique_together = ('item', 'uses')


class SVGImage(models.Model):
    REFNAME = 'svg'

    parent = models.ForeignKey(Media, on_delete=models.CASCADE, null=True)
    path = models.CharField(max_length=128)

    class Meta:
        db_table = 'svgimage'

    def get_html(self):
        return '<img src="{}">'.format(settings.MEDIA_URL + self.path)

    def get_ref(self):
        return '{}:{}'.format(self.REFNAME, self.pk)

    def get_description(self):
        return 'SVG image'

    def finalize(self, media):
        new_path = '{}.{}'.format(media.get_name(), 'svg')
        move(path.join(settings.MEDIA_ROOT, self.path),
             path.join(settings.MEDIA_ROOT, new_path))
        self.parent = media
        self.path = new_path
        self.save()


class CindyMedia(models.Model):
    parent = models.ForeignKey(Media, on_delete=models.CASCADE, null=True)
    path = models.CharField(max_length=128)
    version = models.CharField(max_length=16)
    aspect_ratio = models.FloatField()
    data = models.TextField()

    class Meta:
        db_table = 'cindymedia'

    def create_file(self):
        data = json.loads(self.data).get('create', {})
        if 'ports' not in data:
            raise Exception('No ports declaration')
        if type(data['ports']) is not list or len(data['ports']) != 1:
            raise Exception('Illegal ports declaration')
        for key in ['width', 'height']:
            if key in data['ports'][0]:
                del data['ports'][0][key]
        data['ports'][0]['id'] = 'cscanvas'
        data['ports'][0]['fill'] = 'window'
        if 'scripts' in data:
            del data['scripts']

        content = render_to_string('media/cindy-media.html', {
            'lib': 'https://rawgit.com/janmarthedal/CindyJS-builds/master/v{}/Cindy.js'.format(self.version),
            'create': '{{\n{}\n}}'.format(',\n'.join('  "{}": {}'.format(k, json.dumps(v)) for k, v in data.items()))
        })
        with open(path.join(settings.MEDIA_ROOT, self.path), 'w') as dst:
            dst.write(content)

    def get_html(self):
        return '''<div style="position: relative; width: 100%; height: 0; padding-bottom: {}%;">
      <iframe style="position: absolute; width: 100%; height: 100%; left: 0; top: 0;" src="{}"></iframe>
</div>'''.format(self.aspect_ratio, settings.MEDIA_URL + self.path)

    def get_description(self):
        return 'CindyJS illustration'

    def finalize(self, media):
        new_path = '{}.{}'.format(media.get_name(), 'html')
        move(path.join(settings.MEDIA_ROOT, self.path),
             path.join(settings.MEDIA_ROOT, new_path))
        self.parent = media
        self.path = new_path
        self.save()


def all_file_paths():
    return ([path.join(settings.MEDIA_ROOT, m.path) for m in SVGImage.objects.all()]
            + [path.join(settings.MEDIA_ROOT, m.path) for m in CindyMedia.objects.all()])


# a non-existent file is "infinitely old"
def file_timestamp(filepath):
    try:
        return path.getmtime(filepath)
    except OSError:
        return 0


def kill_abandoned_orphans():
    too_old = int(datetime.now().timestamp() - timedelta(days=1).total_seconds())
    deleted = 0
    for m in SVGImage.objects.filter(parent__isnull=True):
        if file_timestamp(path.join(settings.MEDIA_ROOT, m.path)) <= too_old:
            m.delete()
            deleted += 1
    for m in CindyMedia.objects.filter(parent__isnull=True):
        if file_timestamp(path.join(settings.MEDIA_ROOT, m.path)) <= too_old:
            m.delete()
            deleted += 1
    return deleted
