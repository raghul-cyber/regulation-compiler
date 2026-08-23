import os
import glob

def find_classes(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'className="' in content:
                        print(f"--- {file} ---")
                        lines = content.split('\n')
                        for line in lines:
                            if '<button ' in line or 'className="rounded' in line or '<a ' in line:
                                print(line.strip())

find_classes('apps/web-next/src/components')
