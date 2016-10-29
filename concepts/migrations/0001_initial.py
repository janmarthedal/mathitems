# -*- coding: utf-8 -*-
# Generated by Django 1.10.1 on 2016-10-29 13:31
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('mathitems', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Concept',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=64, unique=True)),
            ],
            options={
                'db_table': 'concepts',
            },
        ),
        migrations.CreateModel(
            name='ConceptDefinition',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('concept', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='concepts.Concept')),
                ('item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='mathitems.MathItem')),
            ],
            options={
                'db_table': 'concept_defs',
            },
        ),
    ]
