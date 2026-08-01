import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find all <Link tags.
    # We want to insert prefetch={false} right after <Link if it doesn't already have prefetch=
    
    # regex to find <Link and add prefetch={false}
    # only replace if it doesn't already have prefetch
    def replacer(match):
        full_match = match.group(0)
        # Check if prefetch is anywhere in the <Link ... > tag.
        # This is a bit tricky with regex if the tag spans multiple lines, 
        # but most of ours are either single line or we can just append it right after <Link
        if 'prefetch=' in full_match:
            return full_match
        return '<Link prefetch={false}'

    # We need a regex that matches from <Link to the first > or \n
    # A simple approach: just replace '<Link ' with '<Link prefetch={false} '
    # and '<Link\n' with '<Link prefetch={false}\n'
    # Then check for duplicates.

    new_content = re.sub(r'<Link\b(?![^>]*prefetch=)', r'<Link prefetch={false}', content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

