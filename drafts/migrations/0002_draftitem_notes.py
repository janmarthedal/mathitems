# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-04-21 07:09
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('drafts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='draftitem',
            name='notes',
            field=models.TextField(blank=True),
        ),
    ]