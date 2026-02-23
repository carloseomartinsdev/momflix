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

CACHE_FILE = "cache_deepseek.json"

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
    """Conecta com a API DeepSeek e retorna a resposta (com cache)"""
    # Verifica cache primeiro
    cache = carregar_cache()
    chave = gerar_chave_cache(prompt)
    
    if chave in cache:
        print(f"📋 Cache hit para prompt")
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
        "max_tokens": 1000,
        "temperature": 0.3
    }
    
    try:
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=data, timeout=TIMEOUT_REQUEST)
        response.raise_for_status()
        resposta = response.json()["choices"][0]["message"]["content"]
        
        # Salva no cache
        cache[chave] = resposta
        salvar_cache(cache)
        print(f"💾 Resposta salva no cache")
        
        return resposta
    except Exception as e:
        print(f"Erro na API (tentativa {tentativa}): {e}")
        if tentativa < MAX_RETRIES:
            time.sleep(2)
            return conectar_deepseek(prompt, tentativa + 1)
        return None

def criar_prompt_titulo(nome_titulo, tipo):
    """Cria prompt específico para buscar informações do título"""
    if tipo == "filme":
        return f"""Forneça informações sobre o filme "{nome_titulo}" em formato JSON:
{{
    "nome": "nome oficial",
    "ano": "ano de lançamento",
    "genero": "gêneros principais",
    "diretor": "diretor principal",
    "sinopse": "sinopse em português",
    "classificacao": "classificação etária",
    "elenco": "elenco principal",
    "duracao": "duração do filme"
}}"""
    else:
        return f"""Forneça informações sobre a série/anime "{nome_titulo}" em formato JSON:
{{
    "nome": "nome oficial",
    "ano": "ano de lançamento",
    "genero": "gêneros principais",
    "diretor": "criador ou diretor",
    "sinopse": "sinopse em português",
    "classificacao": "classificação etária",
    "elenco": "elenco principal ou dubladores",
    "duracao": "duração média dos episódios"
}}"""

def processar_info_principal(nome, info_path, tipo):
    """Processa informações principais do título"""
    print(f"🔍 Verificando: {nome}")
    print(f"📁 Caminho: {info_path}")
    
    # Verifica se já existe info.json
    info_existente = {}
    if os.path.exists(info_path):
        try:
            with open(info_path, 'r', encoding='utf-8') as f:
                info_existente = json.load(f)
            print(f"📄 Info existente carregado")
        except Exception as e:
            print(f"⚠️ Erro ao ler info existente: {e}")
        
        # Se já tem informações básicas completas, pula
        if (info_existente.get("nome") and 
            info_existente.get("sinopse") and 
            info_existente.get("ano") and 
            info_existente.get("genero")):
            print(f"✓ {nome} - já tem informações completas")
            return
    
    print(f"🔍 Buscando informações para: {nome}")
    
    # Busca informações na API
    prompt = criar_prompt_titulo(nome, tipo)
    resposta = conectar_deepseek(prompt)
    
    # Delay entre requests
    time.sleep(DELAY_ENTRE_REQUESTS)
    
    if not resposta:
        print(f"❌ Erro ao buscar {nome}")
        return
    
    print(f"📥 Resposta recebida: {resposta[:200]}...")
    
    try:
        # Extrai JSON da resposta
        inicio = resposta.find('{')
        fim = resposta.rfind('}') + 1
        
        if inicio == -1 or fim == 0:
            print(f"❌ JSON não encontrado na resposta")
            return
            
        json_str = resposta[inicio:fim]
        print(f"🔧 JSON extraído: {json_str[:100]}...")
        
        info_nova = json.loads(json_str)
        print(f"✅ JSON parseado com sucesso")
        
        # Carrega info existente ou cria novo
        info_final = info_existente.copy()
        
        # Atualiza apenas campos vazios
        for campo, valor in info_nova.items():
            if not info_final.get(campo) and valor:
                info_final[campo] = valor
        
        # Cria diretório se não existir
        os.makedirs(os.path.dirname(info_path), exist_ok=True)
        
        # Salva info.json
        with open(info_path, 'w', encoding='utf-8') as f:
            json.dump(info_final, f, ensure_ascii=False, indent=2)
        
        print(f"✅ {nome} - informações salvas em {info_path}")
        
        # Verifica se foi salvo
        if os.path.exists(info_path):
            with open(info_path, 'r', encoding='utf-8') as f:
                verificacao = json.load(f)
            print(f"✓ Verificação: arquivo salvo com {len(verificacao)} campos")
        
    except json.JSONDecodeError as e:
        print(f"❌ Erro ao decodificar JSON para {nome}: {e}")
        print(f"JSON problemático: {json_str}")
    except Exception as e:
        print(f"❌ Erro ao processar {nome}: {e}")
        import traceback
        traceback.print_exc()



def main():
    # Conecta ao banco de dados
    conn = conectar_db()
    if not conn:
        print("❌ Erro ao conectar ao banco de dados")
        return
    
    cursor = conn.cursor(dictionary=True)
    
    # Busca todos os títulos
    cursor.execute("SELECT id, nome, pasta_titulo, tipo FROM titulos")
    titulos = cursor.fetchall()
    
    print(f"📚 Processando {len(titulos)} títulos...")
    
    # Pergunta se quer testar um título específico
    teste = input("\nTestar título específico? (digite o nome ou ENTER para processar todos): ").strip()
    
    if teste:
        titulos = [t for t in titulos if teste.lower() in t['nome'].lower()]
        if not titulos:
            print(f"❌ Título '{teste}' não encontrado")
            return
        print(f"🎯 Testando: {titulos[0]['nome']}")
    
    # Processa cada título
    for titulo in titulos:
        info_path = os.path.join(titulo['pasta_titulo'], 'info.json')
        processar_info_principal(titulo['nome'], info_path, titulo['tipo'])
    
    cursor.close()
    conn.close()
    print("🎉 Processamento concluído!")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        input("\nPressione Enter para fechar...")