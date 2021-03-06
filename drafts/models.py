from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.urls import reverse

from mathitems.models import ItemTypes, MathItem

# import logging
# logger = logging.getLogger(__name__)


class DraftItem(models.Model):
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    item_type = models.CharField(max_length=1, choices=ItemTypes.CHOICES)
    parent = models.ForeignKey(MathItem, null=True, blank=True, on_delete=models.CASCADE)
    body = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'drafts'

    def __str__(self):
        return '{} (Draft{})'.format(self.get_item_type_display(),
                                     ' {}'.format(self.id) if self.id else '')

    def clean(self):
        if self.item_type == ItemTypes.PRF:
            if not self.parent or self.parent.item_type != ItemTypes.THM:
                raise ValidationError('A Proof must have a Theorem parent')
        elif self.parent:
            raise ValidationError('A {} may not have a parent'.format(self.get_item_type_display()))

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('show-draft', args=[self.id])

    def is_def(self):
        return self.item_type == ItemTypes.DEF
