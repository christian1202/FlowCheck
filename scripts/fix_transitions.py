import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to replace 'transition-all' with 'transition-colors transform-gpu' for buttons and links.
    # However, to be safe, any 'transition-all' inside a className that isn't obviously a progress bar
    # can be changed to 'transition-colors transform-gpu' or 'transition-colors opacity transform-gpu'.
    # Actually, a simpler regex is just to look for 'transition-all' and replace it with 'transition-colors transform-gpu'.
    # But let's skip progress bars which usually have 'h-full bg-gradient... rounded-full transition-all duration-1000'
    
    lines = content.split('\n')
    new_lines = []
    changed = False
    
    for line in lines:
        if 'transition-all' in line:
            # Skip progress bars
            if 'duration-1000' in line and 'rounded-full' in line and 'h-full' in line:
                new_lines.append(line)
                continue
            
            # Replace transition-all with transition-colors transform-gpu
            # Wait, some places might need opacity or transform if they scale. 
            # E.g. 'active-scale' scales the button, so it needs 'transition-transform'.
            # 'transition-colors' doesn't transition transform.
            # We can use 'transition-[color,transform,opacity]' but Tailwind doesn't have that built-in.
            # Instead we can use multiple utilities: 'transition-colors transition-transform transition-opacity' ? 
            # Actually Tailwind allows 'transition' which does colors, opacity, transform. But the user specifically said:
            # "Replace them strictly with transition-colors, transition-opacity, or transition-transform combined with transform-gpu"
            # So I will replace 'transition-all' with 'transition-colors transform-gpu' and if 'active-scale' is present, also add 'transition-transform'.
            
            new_line = line
            
            replacement = 'transition-colors transform-gpu'
            if 'active-scale' in line or 'hover-lift' in line or 'scale-' in line:
                replacement = 'transition-colors transition-transform transform-gpu'
            
            new_line = new_line.replace('transition-all', replacement)
            new_lines.append(new_line)
            if new_line != line:
                changed = True
        else:
            new_lines.append(line)
            
    if changed:
        with open(filepath, 'w') as f:
            f.write('\n'.join(new_lines))
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

