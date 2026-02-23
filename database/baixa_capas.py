import json
import requests
import os
import time
import mysql.connector
from pathlib import Path
from config_deepseek import *
from bs4 import BeautifulSoup

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

def limpar_nome_titulo(nome):
    """Limpa nome do título para melhor busca"""
    # Remove sufixos comuns
    sufixos = ['BluRay', '1ª Temporada', '2ª Temporada', '3ª Temporada', 
               'Completa', 'Coleção', 'HD', '720p', '1080p', 'DUAL', 'Dublado']
    
    nome_limpo = nome
    for sufixo in sufixos:
        nome_limpo = nome_limpo.replace(sufixo, '').strip()
    
    # Remove anos no final (ex: "2011", "2023")
    import re
    nome_limpo = re.sub(r'\s+\d{4}$', '', nome_limpo)
    
    # Remove caracteres extras
    nome_limpo = re.sub(r'\s+', ' ', nome_limpo).strip()
    
    return nome_limpo


def baixar_capa(nome_titulo, pasta_destino):
    """Baixa capa via busca no AdoroCinema usando section.movies-results e img.thumbnail-img[data-src]."""
    nome_limpo = limpar_nome_titulo(nome_titulo)
    
    print(f"  🔍 Buscando filme: {nome_limpo}")
    
    try:
        import urllib.parse

        base_url = "https://www.adorocinema.com"
        query = urllib.parse.quote(nome_limpo)
        search_url = f"{base_url}/pesquisar/?q={query}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        
        print(f"  🌐 Acessando busca: {search_url}")
        response = requests.get(search_url, headers=headers, timeout=30)
        print(f"  🌐 Status HTTP: {response.status_code}")
        
        # Aguarda um pouco para o conteúdo carregar
        time.sleep(2)
        
        if response.status_code != 200:
            print(f"  ❌ Erro HTTP {response.status_code} na busca")
            return False
        
        html = response.text
        soup = BeautifulSoup(html, 'html.parser')

        # --- helper pra tratar class como string ou lista ---
        def has_results_section(classes):
            if not classes:
                return False
            if isinstance(classes, str):
                class_list = classes.split()
                return 'movies-results' in class_list or 'series-results' in class_list
            if isinstance(classes, (list, tuple, set)):
                return 'movies-results' in classes or 'series-results' in classes
            return False

        def has_thumbnail_img(classes):
            if not classes:
                return False
            if isinstance(classes, str):
                return 'thumbnail-img' in classes.split()
            if isinstance(classes, (list, tuple, set)):
                return 'thumbnail-img' in classes
            return False

        # 1) Achar o section.movies-results ou section.series-results
        movies_section = soup.find('section', class_=has_results_section)
        if not movies_section:
            # Tenta buscar por outras classes comuns do AdoroCinema
            movies_section = soup.find('section', class_=lambda x: x and 'movie' in ' '.join(x).lower() if x else False)
            
            if not movies_section:
                # Tenta buscar qualquer div com resultados
                movies_section = soup.find('div', class_=lambda x: x and ('result' in ' '.join(x).lower() or 'search' in ' '.join(x).lower()) if x else False)
            
            if not movies_section:
                print("  ❌ Seção de resultados não encontrada")
                print("  🔍 Tentando busca alternativa por qualquer imagem...")
                # Fallback: busca qualquer img que pareça ser uma capa
                all_imgs = soup.find_all('img')
                for img in all_imgs[:10]:  # Verifica as primeiras 10 imagens
                    src = img.get('data-src') or img.get('src', '')
                    if src and ('poster' in src.lower() or 'movie' in src.lower() or 'film' in src.lower()):
                        print(f"  🎯 Imagem encontrada via busca alternativa: {src}")
                        if src.startswith('//'):
                            src = 'https:' + src
                        if src.startswith('http') and not src.startswith('data:image'):
                            return baixar_imagem_direta(src, pasta_destino, headers)
                return False

        # 2) Dentro da section, achar o primeiro <img class="thumbnail-img">
        img_element = movies_section.find('img', class_=has_thumbnail_img)
        if not img_element:
            print("  ❌ img.thumbnail-img não encontrado dentro de section.movies-results")
            # debug
            imgs_debug = movies_section.find_all('img')[:5]
            print("  🔎 Alguns <img> dentro de movies-results:")
            for im in imgs_debug:
                print("   - class:", im.get('class'), "| src:", im.get('src'), "| data-src:", im.get('data-src'))
            return False

        # 3) Pegar URL da capa: data-src primeiro, se não tiver, src
        url_capa = img_element.get('data-src') or img_element.get('src')
        if not url_capa:
            print("  ❌ img.thumbnail-img sem data-src nem src")
            return False

        url_capa = url_capa.strip()
        # ignora gif loader embutido
        if url_capa.startswith('data:image'):
            # tenta fallback se houver
            print("  ⚠️ src é data:image (loader); tentando outro atributo...")
            # nesse seu HTML o data-src já é a capa, então se chegamos aqui algo deu errado
            alt_url = img_element.get('data-src')
            if alt_url and not alt_url.startswith('data:image'):
                url_capa = alt_url.strip()
            else:
                print("  ❌ Apenas data:image disponível, sem URL de imagem real")
                return False

        # completa URLs começando com //
        if url_capa.startswith('//'):
            url_capa = 'https:' + url_capa

        if not url_capa.startswith('http'):
            print(f"  ❌ URL de capa inválida: {url_capa}")
            return False

        print(f"  🖼️ URL da imagem encontrada: {url_capa}")

        # 4) Baixar imagem
        print("  ⬇️ Baixando imagem...")
        img_response = requests.get(url_capa, headers=headers, timeout=30)

        if img_response.status_code != 200:
            print(f"  ❌ Erro HTTP {img_response.status_code} ao baixar imagem")
            return False

        if len(img_response.content) < 1000:
            print(f"  ❌ Imagem muito pequena: {len(img_response.content)} bytes")
            return False

        capa_path = os.path.join(pasta_destino, "capa.jpg")
        with open(capa_path, 'wb') as f:
            f.write(img_response.content)

        print(f"  ✅ Imagem salva ({len(img_response.content)} bytes) em {capa_path}")
        return True

    except Exception as e:
        print(f"  ❌ Erro inesperado: {e}")
        return False

def baixar_imagem_direta(url, pasta_destino, headers):
    """Baixa imagem diretamente de uma URL"""
    try:
        print(f"  ⬇️ Baixando imagem direta: {url}")
        img_response = requests.get(url, headers=headers, timeout=30)
        
        if img_response.status_code != 200:
            return False
            
        if len(img_response.content) < 1000:
            return False
            
        capa_path = os.path.join(pasta_destino, "capa.jpg")
        with open(capa_path, 'wb') as f:
            f.write(img_response.content)
            
        print(f"  ✅ Imagem salva ({len(img_response.content)} bytes)")
        return True
    except:
        return False



def main():
    # Conecta ao banco de dados
    conn = conectar_db()
    if not conn:
        print("❌ Erro ao conectar ao banco de dados")
        return
    
    cursor = conn.cursor(dictionary=True)
    
    # Busca todos os títulos
    cursor.execute("SELECT id, nome, pasta_titulo, is_saga FROM titulos")
    titulos = cursor.fetchall()
    
    print(f"🖼️ Baixando capas para {len(titulos)} títulos...")
    
    for titulo in titulos:
        nome = titulo["nome"]
        pasta = titulo["pasta_titulo"]
        
        # Verifica se já existe capa
        capa_existente = False
        for ext in ['.jpg', '.jpeg', '.png', '.webp']:
            if os.path.exists(os.path.join(pasta, f"capa{ext}")):
                capa_existente = True
                break
        
        if capa_existente:
            print(f"✓ {nome} - já tem capa")
        else:
            print(f"🖼️ Baixando capa para: {nome}")
            
            ok = baixar_capa(nome, pasta)

            if not ok and '-' in nome:
                nome_base = nome.split('-')[0].strip()
                if nome_base and nome_base != nome:
                    print(f"  🔁 Tentando novamente com título simplificado: {nome_base}")
                    ok = baixar_capa(nome_base, pasta)

            if ok:
                print(f"✅ {nome} - capa salva")
            else:
                print(f"❌ {nome} - erro ao baixar capa")
        
        # Se for uma saga, processar filmes individuais
        if titulo["is_saga"]:
            print(f"  📁 Processando filmes da saga: {nome}")
            query = "SELECT id, nome, path FROM filmes_saga WHERE saga_id = %s"
            print(f"  DEBUG: Query = {query}, Param = {titulo['id']}")
            cursor.execute(query, (titulo["id"],))
            filmes = cursor.fetchall()
            
            for filme in filmes:
                nome_filme = filme["nome"]
                if filme["path"]:
                    pasta_filme = os.path.dirname(filme["path"])
                    
                    capa_filme_existe = False
                    for ext in ['.jpg', '.jpeg', '.png', '.webp']:
                        if os.path.exists(os.path.join(pasta_filme, f"capa{ext}")):
                            capa_filme_existe = True
                            break
                    
                    if capa_filme_existe:
                        print(f"    ✓ {nome_filme} - já tem capa")
                    else:
                        print(f"    🖼️ Baixando capa para filme da saga: {nome_filme}")
                        ok_filme = baixar_capa(nome_filme, pasta_filme)
                        
                        if ok_filme:
                            print(f"    ✅ {nome_filme} - capa salva")
                        else:
                            print(f"    ❌ {nome_filme} - erro ao baixar capa")
    
    cursor.close()
    conn.close()
    print("🎉 Download de capas concluído!")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        input("\nPressione Enter para fechar...")