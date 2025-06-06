#!/usr/bin/env python3
import re

# Leggi il file
with open('/Users/gelso/Library/Application Support/Cursor/User/globalStorage/state.vscdb', 'rb') as f:
    content = f.read()

# Pattern da rimuovere (la tua regola specifica)
pattern = b'{"title":"\\[Untitled\\]","knowledge":"-Call me Marco with my name\\.\\\\n- dont\' and never do a commit\\\\n-","knowledgeId":"3402893745163603687"}'

# Rimuovi il pattern
new_content = content.replace(pattern, b'')

# Scrivi il file modificato
with open('/Users/gelso/Library/Application Support/Cursor/User/globalStorage/state.vscdb', 'wb') as f:
    f.write(new_content)

print('Regola rimossa con successo!') 