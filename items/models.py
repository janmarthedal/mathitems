from django.conf import settings
from django.core.urlresolvers import resolve
from django.db import models, IntegrityError
from django.http import Http404
from django.utils import timezone
from django.utils.crypto import get_random_string
from tags.models import Category, Tag
from tags.helpers import CategoryCollection

import logging
logger = logging.getLogger(__name__)

FINAL_NAME_CHARS = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
FINAL_NAME_MIN_LENGTH = 4
FINAL_NAME_MAX_LENGTH = 10

class BaseItem(models.Model):
    
    class Meta:
        abstract = True
        
    TYPE_CHOICES = (
        ('D', 'definition'),
        ('T', 'theorem'),
        ('P', 'proof'),
        ('I', 'info')
    )
    
    itemtype = models.CharField(max_length=1, choices=TYPE_CHOICES)
    parent   = models.ForeignKey('FinalItem', null=True, db_index=False)
    body     = models.TextField(null=True)

    def __init__(self, *args, **kwargs):
        super(BaseItem, self).__init__(*args, **kwargs)
        self._cache = {}

    def _add_category_lists(self, primary_categories, secondary_categories):
        self._add_category_list(primary_categories, True)
        self._add_category_list(secondary_categories, False)

    def _set_category_cache(self):
        categories = [(itemcat.category, itemcat.primary)
                      for itemcat in self._get_item_category_set()]
        self._cache['primary_categories']   = CategoryCollection([t[0] for t in categories if t[1]])
        self._cache['secondary_categories'] = CategoryCollection([t[0] for t in categories if not t[1]])

    @property
    def primary_categories(self):
        if 'primary_categories' not in self._cache:
            self._set_category_cache()
        return self._cache['primary_categories']
    
    @property
    def secondary_categories(self):
        if 'secondary_categories' not in self._cache:
            self._set_category_cache()
        return self._cache['secondary_categories']


def ok_as_final_id(final_id):
    try:
        match = resolve('/%s' % final_id)
        return match.url_name == 'items.views.show_final'
    except Http404:
        return True


class FinalItemManager(models.Manager):
    
    def add_item(self, draft_item):
        item = FinalItem(itemtype    = draft_item.itemtype,
                         status      = 'F',
                         created_by  = draft_item.created_by,
                         modified_by = draft_item.created_by,
                         body        = draft_item.body,
                         parent      = draft_item.parent)
        for length in range(FINAL_NAME_MIN_LENGTH, FINAL_NAME_MAX_LENGTH + 1):
            item.final_id = get_random_string(length, FINAL_NAME_CHARS)
            if ok_as_final_id(item.final_id):
                try:
                    item.save()
                    for itemcat in draft_item.draftitemcategory_set.all():
                        FinalItemCategory.objects.create(item=item, category=itemcat.category,
                                                         primary=itemcat.primary)
                    return item
                except IntegrityError:
                    pass
        raise Exception('FinalItemManager.add_item')
        

class FinalItem(BaseItem):
    
    class Meta:
        db_table = 'final_items'
    
    objects = FinalItemManager()
    
    STATUS_CHOICES = (
        ('F', 'published'),
        ('S', 'suspended'),
        ('B', 'broken')
    )
    
    final_id    = models.CharField(max_length=FINAL_NAME_MAX_LENGTH, unique=True, db_index=True)
    status      = models.CharField(max_length=1, choices=STATUS_CHOICES, default='F')
    created_by  = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', db_index=False)
    created_at  = models.DateTimeField(default=timezone.now)
    modified_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', db_index=False)
    modified_at = models.DateTimeField(default=timezone.now)
    categories  = models.ManyToManyField(Category, through='FinalItemCategory')
    
    def __unicode__(self):
        return "%s %s" % (self.get_itemtype_display().capitalize(), self.final_id)
    
    def _get_item_category_set(self):
        return self.finalitemcategory_set.all()

    def get_tag_category_associations(self):
        return list(self.itemtagcategory_set.all())

    def _add_category_list(self, categories, is_primary):
        for tag_list in categories:
            category = Category.objects.from_tag_list(tag_list)
            FinalItemCategory.objects.create(item=self, category=category, primary=is_primary)

    def set_item_tag_categories(self, tag_category_list):
        for tag_category in tag_category_list:
            tag = Tag.objects.fetch(tag_category['tag'])
            category = tag_category['category']
            if not isinstance(category, Category):
                category = Category.objects.from_tag_list(category)
            ItemTagCategory.objects.create(item=self, tag=tag, category=category)

    def update(self, user, primary_categories, secondary_categories, tag_category_list):
        self.modified_by = user
        self.modified_at = timezone.now()
        self.save()

        self.finalitemcategory_set.all().delete()
        self._add_category_lists(primary_categories, secondary_categories)

        self.itemtagcategory_set.all().delete()
        self.set_item_tag_categories(tag_category_list)


class DraftItemManager(models.Manager):

    def add_item(self, user, itemtype, body, primary_categories, secondary_categories, parent):
        type_key = filter(lambda kc: kc[1] == itemtype, DraftItem.TYPE_CHOICES)[0][0]
        item = DraftItem.objects.create(itemtype   = type_key,
                                        status     = 'D',
                                        created_by = user,
                                        body       = body,
                                        parent     = parent)
        item._add_category_lists(primary_categories, secondary_categories)
        return item


class DraftItem(BaseItem):

    class Meta:
        db_table = 'draft_items'

    objects = DraftItemManager()

    STATUS_CHOICES = (
        ('D', 'draft'),
        ('R', 'under review'),
    )

    status      = models.CharField(max_length=1, choices=STATUS_CHOICES, default='D')
    created_by  = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='+', db_index=False)
    modified_at = models.DateTimeField(default=timezone.now)
    categories  = models.ManyToManyField(Category, through='DraftItemCategory')

    def __unicode__(self):
        return "%s %d" % (self.get_itemtype_display().capitalize(), self.id)

    def _get_item_category_set(self):
        return self.draftitemcategory_set.all()

    def make_review(self):
        if self.status != 'R':
            self.status = 'R'
            self.modified_at = timezone.now()
            self.save()
            logger.debug("%d to review successful" % self.id)

    def _add_category_list(self, categories, is_primary):
        for tag_list in categories:
            category = Category.objects.from_tag_list(tag_list)
            DraftItemCategory.objects.create(item=self, category=category, primary=is_primary)

    def update(self, body, primary_categories, secondary_categories):
        self.modified_at = timezone.now()
        self.body = body
        self.save()
        self.draftitemcategory_set.all().delete()
        self._add_category_lists(primary_categories, secondary_categories)


class DraftItemCategory(models.Model):

    class Meta:
        db_table = 'draft_item_category'
        unique_together = ('item', 'category')
    
    item     = models.ForeignKey(DraftItem, db_index=True)
    category = models.ForeignKey(Category, db_index=False)
    primary  = models.BooleanField()


class FinalItemCategory(models.Model):

    class Meta:
        db_table = 'final_item_category'
        unique_together = ('item', 'category')

    item     = models.ForeignKey(FinalItem, db_index=True)
    category = models.ForeignKey(Category, db_index=False)
    primary  = models.BooleanField()


class ItemTagCategory(models.Model):

    class Meta:
        db_table = 'item_tag_category'
        unique_together = ('item', 'tag')
    
    item     = models.ForeignKey(FinalItem, db_index=True)
    tag      = models.ForeignKey(Tag, db_index=False)
    category = models.ForeignKey(Category, db_index=False)

    def __unicode__(self):
        return u'%s | %s | %s' % (self.item, self.tag, self.category)

    def json_serializable(self):
        return { 'tag':      self.tag,
                 'category': self.category }
