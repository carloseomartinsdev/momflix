import json
import requests
import os
import time
import hashlib
import mysql.connector
from config_deepseek import *

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

CACHE_FILE = "cache_episodios_deepseek.json"

def carregar_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {}

def salvar_cache(cache):
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

def gerar_chave_cache(prompt):
    return hashlib.md5(prompt.encode('utf-8')).hexdigest()

def conectar_deepseek(prompt, tentativa=1):
    cache = carregar_cache()
    chave = gerar_chave_cache(prompt)
    
    if chave in cache:
        print(f"📋 Cache hit para episódio")
        return cache[chave]
    
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 500,
        "temperature": 0.3
    }
    
    try:
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=data, timeout=TIMEOUT_REQUEST)
        response.raise_for_status()
        resposta = response.json()["choices"][0]["message"]["content"]
        
        cache[chave] = resposta
        salvar_cache(cache)
        print(f"💾 Episódio salvo no cache")
        
        return resposta
    except Exception as e:
        print(f"Erro na API (tentativa {tentativa}): {e}")
        if tentativa < MAX_RETRIES:
            time.sleep(2)
            return conectar_deepseek(prompt, tentativa + 1)
        return None

def processar_episodios_serie(titulo_id, nome_titulo, pasta_titulo):
    info_path = os.path.join(pasta_titulo, "info.json")
    
    # Carrega ou cria info.json
    if os.path.exists(info_path):
        with open(info_path, 'r', encoding='utf-8') as f:
            info = json.load(f)
    else:
        info = {}
    
    if "episodios" not in info:
        info["episodios"] = {}
    
    conn = conectar_db()
    if not conn:
        return
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT tag, path FROM episodios WHERE titulo_id = %s", (titulo_id,))
    episodios = cursor.fetchall()
    cursor.close()
    conn.close()
    
    alterado = False
    
    for episodio in episodios:
        ep_tag = episodio["tag"]
        ep_arquivo = os.path.basename(episodio["path"])
        
        if ep_arquivo not in info["episodios"] or not info["episodios"][ep_arquivo].get("sinopse"):
            print(f"📺 Buscando informações para: {nome_titulo} - {ep_tag}")
            
            prompt = f"""Forneça informações sobre o episódio '{ep_tag}' da série '{nome_titulo}' em formato JSON:
{{
    "nome": "nome do episódio",
    "duracao": "duração aproximada em minutos",
    "sinopse": "sinopse em português"
}}"""
            resposta = conectar_deepseek(prompt)
            
            if resposta:
                try:
                    inicio = resposta.find('{')
                    fim = resposta.rfind('}') + 1
                    json_str = resposta[inicio:fim]
                    ep_info = json.loads(json_str)
                    
                    info["episodios"][ep_arquivo] = ep_info
                    alterado = True
                    print(f"✅ {ep_tag} - informações salvas")
                except:
                    print(f"❌ Erro ao processar {ep_tag}")
            
            time.sleep(DELAY_ENTRE_REQUESTS)
    
    if alterado:
        with open(info_path, 'w', encoding='utf-8') as f:
            json.dump(info, f, ensure_ascii=False, indent=2)
        print(f"💾 {nome_titulo} - info.json atualizado")

def main():
    conn = conectar_db()
    if not conn:
        print("❌ Erro ao conectar ao banco de dados")
        return
    
    cursor = conn.cursor(dictionary=True)
    
    # Busca séries (títulos que têm episódios)
    cursor.execute("""
        SELECT DISTINCT t.id, t.nome, t.pasta_titulo 
        FROM titulos t
        INNER JOIN episodios e ON t.id = e.titulo_id
    """)
    series = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    print(f"📺 Processando episódios de {len(series)} séries...")
    
    for serie in series:
        processar_episodios_serie(serie['id'], serie['nome'], serie['pasta_titulo'])
    
    print("🎉 Processamento de episódios concluído!")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        input("\nPressione Enter para fechar...")