# -*- coding: utf-8 -*-
import urllib.request
import os
import sys

# Set UTF-8 encoding for output
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Create images/blog directory if it doesn't exist
os.makedirs('images/blog', exist_ok=True)

# Blog images URLs
images = [
    {
        'url': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop',
        'filename': 'images/blog/blog-1.jpg'
    },
    {
        'url': 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=600&fit=crop',
        'filename': 'images/blog/blog-2.jpg'
    },
    {
        'url': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop',
        'filename': 'images/blog/blog-3.jpg'
    }
]

print('Downloading blog images...')
for img in images:
    try:
        print(f'Downloading {img["filename"]}...')
        urllib.request.urlretrieve(img['url'], img['filename'])
        print(f'Success: {img["filename"]} downloaded')
    except Exception as e:
        print(f'Error downloading {img["filename"]}: {e}')

print('\nDownload completed!')

