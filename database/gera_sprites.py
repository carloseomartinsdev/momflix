import os
import subprocess
import mysql.connector
from pathlib import Path

# CONFIGURAÇÃO DO BANCO DE DADOS
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': '',
    'database': 'mom_flix'
}

def conectar_db():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"⚠ Erro ao conectar ao MySQL: {e}")
        return None

def gerar_sprite(video_path, output_path):
    """Gera sprite sheet 10x10 com 100 frames distribuídos ao longo do vídeo"""
    try:
        # Cria diretório se não existir
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Comando FFmpeg: 1 frame por segundo do vídeo, pega 100 frames uniformemente distribuídos
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-vf', 'fps=1/10,scale=160:90,tile=10x10',
            '-frames:v', '1',
            '-y',
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0 and os.path.exists(output_path):
            return True
        else:
            print(f"  ❌ Erro FFmpeg: {result.stderr[:200]}")
            return False
            
    except Exception as e:
        print(f"  ❌ Erro ao gerar sprite: {e}")
        return False

def main():
    conn = conectar_db()
    if not conn:
        print("❌ Erro ao conectar ao banco de dados")
        return
    
    cursor = conn.cursor(dictionary=True)
    
    # Busca todos os vídeos (filmes + episódios)
    print("📊 Buscando vídeos no banco...")
    
    videos = []
    
    # Filmes
    cursor.execute("SELECT id, nome, path, pasta_titulo FROM titulos WHERE tipo = 'filme' AND is_saga = 0 AND path IS NOT NULL")
    for row in cursor.fetchall():
        videos.append({
            'tipo': 'filme',
            'id': row['id'],
            'nome': row['nome'],
            'path': row['path'],
            'pasta': row['pasta_titulo']
        })
    
    # Episódios
    cursor.execute("SELECT e.id, t.nome, e.tag, e.path, t.pasta_titulo FROM episodios e JOIN titulos t ON e.titulo_id = t.id")
    for row in cursor.fetchall():
        videos.append({
            'tipo': 'episodio',
            'id': row['id'],
            'nome': f"{row['nome']} - {row['tag']}",
            'path': row['path'],
            'pasta': row['pasta_titulo']
        })
    
    # Filmes de saga
    cursor.execute("SELECT f.id, t.nome, f.nome as filme_nome, f.path, f.pasta_filme FROM filmes_saga f JOIN titulos t ON f.saga_id = t.id")
    for row in cursor.fetchall():
        videos.append({
            'tipo': 'saga',
            'id': row['id'],
            'nome': f"{row['nome']} - {row['filme_nome']}",
            'path': row['path'],
            'pasta': row['pasta_filme']
        })
    
    cursor.close()
    conn.close()
    
    print(f"📺 Total de vídeos: {len(videos)}")
    
    # Pergunta se quer testar um específico
    teste = input("\nTestar vídeo específico? (digite parte do nome ou ENTER para processar todos): ").strip()
    
    if teste:
        videos = [v for v in videos if teste.lower() in v['nome'].lower()]
        if not videos:
            print(f"❌ Vídeo '{teste}' não encontrado")
            return
        print(f"🎯 Testando: {videos[0]['nome']}")
    
    # Processa cada vídeo
    processados = 0
    erros = 0
    pulados = 0
    
    for i, video in enumerate(videos, 1):
        print(f"\n[{i}/{len(videos)}] {video['nome']}")
        
        # Verifica se vídeo existe
        if not os.path.exists(video['path']):
            print(f"  ⚠ Vídeo não encontrado: {video['path']}")
            erros += 1
            continue
        
        # Define caminho do sprite
        sprite_path = os.path.join(video['pasta'], 'sprite.jpg')
        
        # Pula se já existe
        if os.path.exists(sprite_path):
            print(f"  ✓ Sprite já existe")
            pulados += 1
            continue
        
        # Gera sprite
        print(f"  🎬 Gerando sprite...")
        if gerar_sprite(video['path'], sprite_path):
            print(f"  ✅ Sprite gerado: {sprite_path}")
            processados += 1
        else:
            erros += 1
    
    print(f"\n{'='*60}")
    print(f"✅ Processados: {processados}")
    print(f"⏭ Pulados (já existiam): {pulados}")
    print(f"❌ Erros: {erros}")
    print(f"{'='*60}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Erro: {e}")
        import traceback
        traceback.print_exc()
    finally:
        input("\nPressione Enter para fechar...")
