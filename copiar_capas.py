import mysql.connector
import os
import shutil
from pathlib import Path
import glob

DB_CONFIG = {
    'host': 'mysql832.umbler.com',
    'port': 41890,
    'user': 'momflix',
    'password': '89XyllYVt_Ki#',
    'database': 'momflix'
}

def main():
    capas_dir = Path(__file__).parent / 'public' / 'capas'
    sprites_dir = Path(__file__).parent / 'public' / 'sprites'
    capas_dir.mkdir(exist_ok=True)
    sprites_dir.mkdir(exist_ok=True)
    
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    
    copiados = 0
    sprites_copiados = 0
    erros = 0
    
    # Processar filmes
    cursor.execute("SELECT id, pasta_titulo, path, nome FROM titulos WHERE tipo = 'filme' AND is_saga = 0 AND path IS NOT NULL")
    filmes = cursor.fetchall()
    print(f"\n📽️ Processando {len(filmes)} filmes...")
    
    for row in filmes:
        id_titulo = row['id']
        pasta = row['pasta_titulo'].replace('Midias', 'Mideas') if row['pasta_titulo'] else None
        nome = row['nome']
        
        print(f"Processando {id_titulo}: {pasta}")
        
        if not pasta:
            print(f"  ❌ Pasta vazia")
            continue
            
        if not os.path.isdir(pasta):
            print(f"  ❌ Pasta não existe ou não é diretório")
            continue
        
        # Copiar capa
        capa_origem = None
        for nome in ['capa.jpg', 'capa.jpeg', 'capa.png', 'capa.webp']:
            path = os.path.join(pasta, nome)
            if os.path.exists(path):
                capa_origem = path
                break
        
        if capa_origem:
            capa_destino = capas_dir / f"{id_titulo}.jpg"
            try:
                shutil.copy2(capa_origem, capa_destino)
                print(f"✅ Filme {id_titulo}: Capa copiada")
                copiados += 1
            except Exception as e:
                print(f"❌ Filme {id_titulo}: Erro ao copiar capa - {e}")
                erros += 1
        
        # Copiar sprite - busca qualquer arquivo sprite_*.jpg na pasta
        sprites_na_pasta = [f for f in os.listdir(pasta) if f.startswith('sprite_') and f.endswith('.jpg')]
        if sprites_na_pasta:
            sprite_origem = os.path.join(pasta, sprites_na_pasta[0])
            sprite_destino = sprites_dir / f"sprite_{id_titulo}.jpg"
            try:
                shutil.copy2(sprite_origem, sprite_destino)
                print(f"✅ Filme {id_titulo}: Sprite copiado")
                sprites_copiados += 1
            except Exception as e:
                print(f"❌ Filme {id_titulo}: Erro ao copiar sprite - {e}")
        else:
            print(f"⚠️  Filme {id_titulo}: Sem sprite")
    
    # Processar episódios
    cursor.execute("SELECT e.id, t.pasta_titulo FROM episodios e JOIN titulos t ON e.titulo_id = t.id")
    for row in cursor.fetchall():
        id_episodio = row['id']
        pasta = row['pasta_titulo'].replace('Midias', 'Mideas') if row['pasta_titulo'] else None
        
        if not pasta or not os.path.isdir(pasta):
            continue
        
        # Copiar sprite do episódio - busca qualquer sprite_*.jpg
        sprites_na_pasta = [f for f in os.listdir(pasta) if f.startswith('sprite_') and f.endswith('.jpg')]
        if sprites_na_pasta:
            sprite_origem = os.path.join(pasta, sprites_na_pasta[0])
            sprite_destino = sprites_dir / f"sprite_{id_episodio}.jpg"
            try:
                shutil.copy2(sprite_origem, sprite_destino)
                print(f"✅ Episódio {id_episodio}: Sprite copiado")
                sprites_copiados += 1
            except Exception as e:
                print(f"❌ Episódio {id_episodio}: Erro ao copiar sprite - {e}")
    
    # Processar filmes de saga
    cursor.execute("SELECT f.id, f.pasta_filme FROM filmes_saga f WHERE f.pasta_filme IS NOT NULL")
    filmes_saga = cursor.fetchall()
    print(f"\n🎬 Processando {len(filmes_saga)} filmes de saga...")
    
    for row in filmes_saga:
        id_filme = row['id']
        pasta = row['pasta_filme'].replace('Midias', 'Mideas') if row['pasta_filme'] else None
        
        if not pasta or not os.path.isdir(pasta):
            continue
        
        # Copiar capa
        capa_origem = None
        for nome in ['capa.jpg', 'capa.jpeg', 'capa.png', 'capa.webp']:
            path = os.path.join(pasta, nome)
            if os.path.exists(path):
                capa_origem = path
                break
        
        if capa_origem:
            capa_destino = capas_dir / f"{id_filme}.jpg"
            try:
                shutil.copy2(capa_origem, capa_destino)
                print(f"✅ Filme saga {id_filme}: Capa copiada")
                copiados += 1
            except Exception as e:
                print(f"❌ Filme saga {id_filme}: Erro ao copiar capa - {e}")
        
        # Copiar sprite
        sprites_na_pasta = [f for f in os.listdir(pasta) if f.startswith('sprite_') and f.endswith('.jpg')]
        if sprites_na_pasta:
            sprite_origem = os.path.join(pasta, sprites_na_pasta[0])
            sprite_destino = sprites_dir / f"sprite_{id_filme}.jpg"
            try:
                shutil.copy2(sprite_origem, sprite_destino)
                print(f"✅ Filme saga {id_filme}: Sprite copiado")
                sprites_copiados += 1
            except Exception as e:
                print(f"❌ Filme saga {id_filme}: Erro ao copiar sprite - {e}")
    
    # Processar títulos restantes (séries, etc) para capas
    cursor.execute("SELECT id, pasta_titulo FROM titulos WHERE (tipo != 'filme' OR is_saga = 1 OR path IS NULL)")
    for row in cursor.fetchall():
        id_titulo = row['id']
        pasta = row['pasta_titulo'].replace('Midias', 'Mideas') if row['pasta_titulo'] else None
        
        if not pasta or not os.path.isdir(pasta):
            continue
        
        # Copiar capa
        capa_origem = None
        for nome in ['capa.jpg', 'capa.jpeg', 'capa.png', 'capa.webp']:
            path = os.path.join(pasta, nome)
            if os.path.exists(path):
                capa_origem = path
                break
        
        if capa_origem:
            capa_destino = capas_dir / f"{id_titulo}.jpg"
            try:
                shutil.copy2(capa_origem, capa_destino)
                print(f"✅ Título {id_titulo}: Capa copiada")
                copiados += 1
            except Exception as e:
                print(f"❌ Título {id_titulo}: Erro ao copiar capa - {e}")
    
    cursor.close()
    conn.close()
    
    print(f"\n🎉 Concluído!")
    print(f"✅ Capas copiadas: {copiados}")
    print(f"✅ Sprites copiados: {sprites_copiados}")
    print(f"❌ Erros: {erros}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ Erro: {e}")
    finally:
        input("\nPressione Enter para fechar...")
