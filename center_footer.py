import re

with open('src/views/index.ejs', 'r') as f:
    content = f.read()

# 1. Top row flex container
content = content.replace(
    'class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80"',
    'class="flex flex-col items-center justify-center gap-6 pb-8 border-b border-slate-800/80 text-center"'
)

# 2. Brand/description container
content = content.replace(
    'class="max-w-md space-y-2"',
    'class="max-w-md space-y-4 flex flex-col items-center"'
)

# 3. Social icons container
content = content.replace(
    'class="flex flex-wrap items-center gap-3"',
    'class="flex flex-wrap items-center justify-center gap-3"'
)

# 4. Bottom row flex container
content = content.replace(
    'class="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500"',
    'class="flex flex-col items-center justify-center gap-4 text-slate-500 text-center"'
)

# 5. Admin/bases links container
content = content.replace(
    'class="flex flex-wrap items-center gap-4 text-xs font-semibold"',
    'class="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold"'
)

with open('src/views/index.ejs', 'w') as f:
    f.write(content)

print("Footer centered successfully")
