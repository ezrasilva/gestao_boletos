# Vercel API Handler
import sys
from pathlib import Path

# Adiciona a raiz do projeto no path
root = Path(__file__).parent.parent
sys.path.insert(0, str(root))

from api.index import app

# Exporta como handler para Vercel
async def handler(request):
    return await app(request)
