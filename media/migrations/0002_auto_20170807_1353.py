# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-08-07 11:53
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('mathitems', '0001_initial'),
        ('media', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ItemMediaDependency',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='mathitems.MathItem')),
                ('uses', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='media.Media')),
            ],
            options={
                'db_table': 'item_media_deps',
            },
        ),
        migrations.AlterUniqueTogether(
            name='itemmediadependency',
            unique_together=set([('item', 'uses')]),
        ),
    ]
