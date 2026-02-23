import os
import re
import json
import traceback
import hashlib
import mysql.connector
from mysql.connector import Error
import time
import sys

# CONFIGURAÇÃO DO BANCO DE DADOS
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': '',
    'database': 'mom_flix'
}

UNIDADES = {
    r"E:\Midias": "HD E:",
    r"F:\Midias": "HD F:",
    r"G:\Midias": "HD G:",
    r"H:\Midias": "HD H:",
}

TIPOS = {
    "filme":   "Filmes",
    "serie":   "Series",
    "bl":      "Bls",
    "donghua": "Donghuas",
    "anime": "Animes",
}

VIDEO_EXTS = (".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv")

def progresso(atual, total, texto="Processando"):
    if total > 0:
        pct = int((atual / total) * 100)
        sys.stdout.write(f"\r{texto}: {atual}/{total} ({pct}%)")
        sys.stdout.flush()
        if atual == total:
            print()

def conectar_db():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"⚠ Erro ao conectar ao MySQL: {e}")
        return None

def listar_videos_na_pasta(pasta):
    if not os.path.isdir(pasta):
        return []
    arquivos = []
    for nome in os.listdir(pasta):
        caminho = os.path.join(pasta, nome)
        if os.path.isfile(caminho) and nome.lower().endswith(VIDEO_EXTS):
            arquivos.append(caminho)
    return sorted(arquivos, key=str.lower)

def achar_capa(pasta_titulo):
    if not os.path.isdir(pasta_titulo):
        return None
    
    for arquivo in os.listdir(pasta_titulo):
        nome, ext = os.path.splitext(arquivo)
        if nome.lower() == "capa" and ext.lower() in (".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"):
            return os.path.join(pasta_titulo, arquivo)
    return None

def verificar_estrutura_completa(pasta_titulo):
    tem_mp4 = any(f.lower().endswith('.mp4') for f in os.listdir(pasta_titulo) if os.path.isfile(os.path.join(pasta_titulo, f)))
    tem_capa = achar_capa(pasta_titulo) is not None
    tem_sprites = os.path.exists(os.path.join(pasta_titulo, 'sprites'))
    tem_info = os.path.exists(os.path.join(pasta_titulo, 'info.json'))
    
    return {
        'completo': tem_mp4 and tem_capa and tem_sprites and tem_info,
        'mp4': tem_mp4,
        'capa': tem_capa,
        'sprites': tem_sprites,
        'info': tem_info
    }

def buscar_ou_criar_info(pasta_titulo, nome_titulo, tipo, episodios_data=None, saga_data=None, id_titulo=None):
    info_path = os.path.join(pasta_titulo, "info.json")
    estrutura = verificar_estrutura_completa(pasta_titulo)
    
    if os.path.exists(info_path):
        try:
            with open(info_path, "r", encoding="utf-8") as f:
                info = json.load(f)
                
            info["_status"] = {
                "estrutura_completa": estrutura['completo'],
                "tem_mp4": estrutura['mp4'],
                "tem_capa": estrutura['capa'],
                "tem_sprites": estrutura['sprites'],
                "carregado_banco": info.get("_status", {}).get("carregado_banco", False),
                "ultima_atualizacao": time.time()
            }
            
            if episodios_data and "episodios" not in info:
                info["episodios"] = {}
            if saga_data and "filmes_saga" not in info:
                info["filmes_saga"] = {}
            
            with open(info_path, "w", encoding="utf-8") as f:
                json.dump(info, f, indent=2, ensure_ascii=False)
            
            return info
        except:
            pass
    
    info_padrao = {
        "idTitulo": id_titulo or gerar_id_unico(f"{nome_titulo}_{tipo}"),
        "nome": nome_titulo,
        "duracao": "",
        "genero": "",
        "classificacao": "",
        "sinopse": "",
        "ano": "",
        "diretor": "",
        "elenco": "",
        "_status": {
            "estrutura_completa": estrutura['completo'],
            "tem_mp4": estrutura['mp4'],
            "tem_capa": estrutura['capa'],
            "tem_sprites": estrutura['sprites'],
            "carregado_banco": False,
            "ultima_atualizacao": time.time()
        }
    }
    
    if episodios_data:
        info_padrao["episodios"] = {}
    if saga_data:
        info_padrao["filmes_saga"] = {}
    
    try:
        with open(info_path, "w", encoding="utf-8") as f:
            json.dump(info_padrao, f, indent=2, ensure_ascii=False)
    except:
        pass
    
    return info_padrao

def extrair_tag_episodio(nome_arquivo):
    base = os.path.basename(nome_arquivo)
    nome_sem_ext, _ = os.path.splitext(base)
    m = re.search(r"\b(\d{2}x\d{3})\b", nome_sem_ext)
    if m:
        return m.group(1)
    return nome_sem_ext

def gerar_id_unico(conteudo):
    return hashlib.md5(conteudo.encode('utf-8')).hexdigest()[:8]

def selecionar_opcoes():
    print("\nSelecione o tipo para atualizar:")
    print("1. Filmes")
    print("2. Series")
    print("3. BLs")
    print("4. Animes")
    print("5. Donghuas")
    print("6. Todos")
    
    while True:
        escolha = input("\nDigite o número (1-6): ").strip()
        if escolha == "1":
            tipos = ["filme"]
            break
        elif escolha == "2":
            tipos = ["serie"]
            break
        elif escolha == "3":
            tipos = ["bl"]
            break
        elif escolha == "4":
            tipos = ["anime"]
            break
        elif escolha == "5":
            tipos = ["donghua"]
            break
        elif escolha == "6":
            tipos = list(TIPOS.keys())
            break
        else:
            print("Opção inválida! Digite um número de 1 a 6.")
    
    print("\nOpções de atualização:")
    print("1. Atualização inteligente (apenas itens novos/modificados)")
    print("2. Resetar e refazer tudo (ignora status)")
    
    while True:
        modo = input("\nDigite o número (1-2): ").strip()
        if modo == "1":
            return tipos, False
        elif modo == "2":
            return tipos, True
        else:
            print("Opção inválida! Digite 1 ou 2.")

def resetar_status_arquivos(tipos_selecionados):
    print("Resetando status dos arquivos info.json...")
    
    for raiz_unidade, label_hd in UNIDADES.items():
        if not os.path.isdir(raiz_unidade):
            continue
            
        for tipo, pasta_cat in TIPOS.items():
            if tipo not in tipos_selecionados:
                continue
                
            base_cat = os.path.join(raiz_unidade, pasta_cat)
            if not os.path.isdir(base_cat):
                continue
                
            for nome_titulo in os.listdir(base_cat):
                pasta_titulo = os.path.join(base_cat, nome_titulo)
                if os.path.isdir(pasta_titulo):
                    info_path = os.path.join(pasta_titulo, "info.json")
                    if os.path.exists(info_path):
                        try:
                            with open(info_path, "r", encoding="utf-8") as f:
                                info = json.load(f)
                            
                            if "_status" in info:
                                info["_status"]["carregado_banco"] = False
                                info["_status"]["ultima_atualizacao"] = time.time()
                                
                                with open(info_path, "w", encoding="utf-8") as f:
                                    json.dump(info, f, indent=2, ensure_ascii=False)
                        except:
                            pass

def marcar_como_carregado(pasta_titulo):
    info_path = os.path.join(pasta_titulo, "info.json")
    if os.path.exists(info_path):
        try:
            with open(info_path, "r", encoding="utf-8") as f:
                info = json.load(f)
            
            if "_status" not in info:
                info["_status"] = {}
            
            info["_status"]["carregado_banco"] = True
            info["_status"]["ultima_atualizacao"] = time.time()
            
            with open(info_path, "w", encoding="utf-8") as f:
                json.dump(info, f, indent=2, ensure_ascii=False)
        except:
            pass

def coletar_itens(tipos_selecionados):
    itens = []
    print(f"Iniciando varredura para tipos: {', '.join(tipos_selecionados)}")
    
    for raiz_unidade, label_hd in UNIDADES.items():
        if not os.path.isdir(raiz_unidade):
            continue

        for tipo, pasta_cat in TIPOS.items():
            if tipo not in tipos_selecionados:
                continue
                
            base_cat = os.path.join(raiz_unidade, pasta_cat)
            if not os.path.isdir(base_cat):
                continue

            print(f"Processando {pasta_cat} em {label_hd}...")
            contador = 0
            lista_pastas = [d for d in os.listdir(base_cat) if os.path.isdir(os.path.join(base_cat, d))]
            total_pastas = len(lista_pastas)

            if tipo == "filme":
                for nome_titulo in sorted(lista_pastas, key=str.lower):
                    contador += 1
                    progresso(contador, total_pastas, f"Coletando {pasta_cat}")
                    pasta_titulo = os.path.join(base_cat, nome_titulo)
                    if not os.path.isdir(pasta_titulo):
                        continue

                    videos = listar_videos_na_pasta(pasta_titulo)
                    subpastas_com_videos = []
                    
                    # Verifica sagas (subpastas com vídeos)
                    for item in os.listdir(pasta_titulo):
                        subpasta = os.path.join(pasta_titulo, item)
                        if os.path.isdir(subpasta):
                            videos_sub = listar_videos_na_pasta(subpasta)
                            if videos_sub:
                                subpastas_com_videos.append({
                                    "nome": item,
                                    "videos": videos_sub,
                                    "capa": achar_capa(subpasta)
                                })
                    
                    if subpastas_com_videos:
                        # É uma saga
                        chave_saga = f"{nome_titulo}_{tipo}_{label_hd}"
                        id_saga = gerar_id_unico(chave_saga)
                        info = buscar_ou_criar_info(pasta_titulo, nome_titulo, tipo, saga_data=subpastas_com_videos, id_titulo=id_saga)
                        
                        for filme in subpastas_com_videos:
                            pasta_filme = os.path.join(pasta_titulo, filme["nome"])
                            id_filme = gerar_id_unico(f"{nome_titulo}_saga_{filme['nome']}")
                            filme["info"] = buscar_ou_criar_info(pasta_filme, filme["nome"], tipo, id_titulo=id_filme)
                            filme["idTitulo"] = id_filme
                        
                        itens.append({
                            "tipo": tipo,
                            "titulo": nome_titulo,
                            "titulo_normalizado": nome_titulo.lower(),
                            "hd": label_hd,
                            "capa": achar_capa(pasta_titulo),
                            "videos": [],
                            "series_info": None,
                            "saga_info": subpastas_com_videos,
                            "is_saga": True,
                            "info": info,
                            "pasta_titulo": pasta_titulo,
                            "idTitulo": id_saga
                        })
                    elif videos:
                        # Filme simples
                        chave_titulo = f"{nome_titulo}_{tipo}_{label_hd}"
                        id_titulo = gerar_id_unico(chave_titulo)
                        info = buscar_ou_criar_info(pasta_titulo, nome_titulo, tipo, id_titulo=id_titulo)
                        
                        itens.append({
                            "tipo": tipo,
                            "titulo": nome_titulo,
                            "titulo_normalizado": nome_titulo.lower(),
                            "hd": label_hd,
                            "capa": achar_capa(pasta_titulo),
                            "videos": videos,
                            "series_info": None,
                            "saga_info": None,
                            "is_saga": False,
                            "info": info,
                            "pasta_titulo": pasta_titulo,
                            "idTitulo": id_titulo
                        })
            else:
                for nome_serie in sorted(lista_pastas, key=str.lower):
                    contador += 1
                    progresso(contador, total_pastas, f"Coletando {pasta_cat}")
                    pasta_serie = os.path.join(base_cat, nome_serie)
                    if not os.path.isdir(pasta_serie):
                        continue

                    temporadas = []
                    
                    # Verifica temporadas
                    for nome_temp in sorted(os.listdir(pasta_serie), key=str.lower):
                        pasta_temp = os.path.join(pasta_serie, nome_temp)
                        if not os.path.isdir(pasta_temp):
                            continue
                        
                        is_temporada = ("temporada" in nome_temp.lower() or re.search(r'\b(s?\d{1,2})\b', nome_temp.lower()))
                        
                        if is_temporada:
                            # Verifica subpastas 001-100
                            subpastas_100 = []
                            for item in os.listdir(pasta_temp):
                                subpasta = os.path.join(pasta_temp, item)
                                if os.path.isdir(subpasta) and re.search(r'\d{3}\s*-\s*\d{3}', item):
                                    subpastas_100.append(subpasta)
                            
                            if subpastas_100:
                                lista_eps = []
                                for subpasta in subpastas_100:
                                    episodios = listar_videos_na_pasta(subpasta)
                                    for ep_path in episodios:
                                        tag = extrair_tag_episodio(ep_path)
                                        lista_eps.append({"tag": tag, "path": ep_path})
                                if lista_eps:
                                    temporadas.append({"nome_temporada": nome_temp, "episodios": lista_eps})
                            else:
                                episodios = listar_videos_na_pasta(pasta_temp)
                                if episodios:
                                    lista_eps = []
                                    for ep_path in episodios:
                                        tag = extrair_tag_episodio(ep_path)
                                        lista_eps.append({"tag": tag, "path": ep_path})
                                    temporadas.append({"nome_temporada": nome_temp, "episodios": lista_eps})

                    # Se não encontrou temporadas, verifica diretamente
                    if not temporadas:
                        subpastas_100 = []
                        for item in os.listdir(pasta_serie):
                            subpasta = os.path.join(pasta_serie, item)
                            if os.path.isdir(subpasta) and re.search(r'\d{3}\s*-\s*\d{3}', item):
                                subpastas_100.append(subpasta)
                        
                        if subpastas_100:
                            lista_eps = []
                            for subpasta in subpastas_100:
                                episodios = listar_videos_na_pasta(subpasta)
                                for ep_path in episodios:
                                    tag = extrair_tag_episodio(ep_path)
                                    lista_eps.append({"tag": tag, "path": ep_path})
                            if lista_eps:
                                temporadas.append({"nome_temporada": "Temporada 1", "episodios": lista_eps})
                        else:
                            episodios_diretos = listar_videos_na_pasta(pasta_serie)
                            if episodios_diretos:
                                lista_eps = []
                                for ep_path in episodios_diretos:
                                    tag = extrair_tag_episodio(ep_path)
                                    lista_eps.append({"tag": tag, "path": ep_path})
                                temporadas.append({"nome_temporada": "Temporada 1", "episodios": lista_eps})

                    if temporadas:
                        todos_episodios = []
                        for temp in temporadas:
                            todos_episodios.extend(temp["episodios"])
                        
                        chave_serie = f"{nome_serie}_{tipo}_{label_hd}"
                        id_serie = gerar_id_unico(chave_serie)
                        info = buscar_ou_criar_info(pasta_serie, nome_serie, tipo, episodios_data=todos_episodios, id_titulo=id_serie)
                        
                        for temp in temporadas:
                            for ep in temp["episodios"]:
                                chave_ep = f"{id_serie}_{temp['nome_temporada']}_{ep['tag']}"
                                ep["idTitulo"] = gerar_id_unico(chave_ep)
                                ep["info"] = info.get("episodios", {}).get(os.path.basename(ep["path"]), {"titulo": ep["tag"], "duracao": "", "sinopse": ""})
                        
                        itens.append({
                            "tipo": tipo,
                            "titulo": nome_serie,
                            "titulo_normalizado": nome_serie.lower(),
                            "hd": label_hd,
                            "capa": achar_capa(pasta_serie),
                            "videos": [],
                            "series_info": temporadas,
                            "saga_info": None,
                            "is_saga": False,
                            "info": info,
                            "pasta_titulo": pasta_serie,
                            "idTitulo": id_serie
                        })

    print(f"Total de itens encontrados: {len(itens)}")
    return itens

def processar_catalogo(itens):
    conn = conectar_db()
    titulos_antigos = {}
    
    if conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT id, nome, adicionado_em FROM titulos")
            for row in cursor.fetchall():
                titulos_antigos[row['nome']] = row['adicionado_em']
        except:
            pass
        finally:
            cursor.close()
            conn.close()
    
    agora = time.time()
    sete_dias = 7 * 24 * 60 * 60
    
    for item in itens:
        if item["titulo"] in titulos_antigos:
            item["adicionado_em"] = titulos_antigos[item["titulo"]]
            item["is_novo"] = (agora - float(item["adicionado_em"])) < sete_dias
        else:
            item["adicionado_em"] = agora
            item["is_novo"] = True
    
    return itens

def atualizar_banco_dados(itens, tipos_selecionados, forcar_reset=False):
    conn = conectar_db()
    if not conn:
        print("❌ Não foi possível conectar ao banco de dados")
        return False
    
    cursor = conn.cursor()
    
    try:
        print(f"\n📊 Atualizando banco de dados MySQL para tipos: {', '.join(tipos_selecionados)}...")
        
        if forcar_reset:
            resetar_status_arquivos(tipos_selecionados)
            # Limpa apenas dados relacionados, preservando títulos e histórico
            placeholders = ','.join(['%s'] * len(tipos_selecionados))
            cursor.execute(f"DELETE FROM episodios WHERE titulo_id IN (SELECT id FROM titulos WHERE tipo IN ({placeholders}))", tipos_selecionados)
            cursor.execute(f"DELETE FROM filmes_saga WHERE saga_id IN (SELECT id FROM titulos WHERE tipo IN ({placeholders}))", tipos_selecionados)
            cursor.execute(f"DELETE FROM titulo_genero WHERE titulo_id IN (SELECT id FROM titulos WHERE tipo IN ({placeholders}))", tipos_selecionados)
            itens_para_atualizar = itens
            print(f"RESET: Limpeza de dados dos tipos: {', '.join(tipos_selecionados)} (títulos e histórico preservados)")
        else:
            itens_para_atualizar = []
            itens_completos = []
            
            for item in itens:
                status = item.get("info", {}).get("_status", {})
                ja_carregado = status.get("carregado_banco", False)
                estrutura_completa = status.get("estrutura_completa", False)
                
                if estrutura_completa:
                    itens_completos.append(item)
                
                if not ja_carregado or not estrutura_completa:
                    itens_para_atualizar.append(item)
            
            print(f"  - {len(itens_completos)} itens com estrutura completa")
            print(f"  - {len(itens_para_atualizar)} itens precisam atualização")
            
            if not itens_para_atualizar:
                print("✓ Nenhum item precisa ser atualizado!")
                return True
            
            # Limpa apenas dados relacionados dos itens específicos
            ids_para_remover = [item['idTitulo'] for item in itens_para_atualizar]
            if ids_para_remover:
                placeholders = ','.join(['%s'] * len(ids_para_remover))
                cursor.execute(f"DELETE FROM episodios WHERE titulo_id IN ({placeholders})", ids_para_remover)
                cursor.execute(f"DELETE FROM filmes_saga WHERE saga_id IN ({placeholders})", ids_para_remover)
                cursor.execute(f"DELETE FROM titulo_genero WHERE titulo_id IN ({placeholders})", ids_para_remover)
                print(f"Limpeza de dados de {len(ids_para_remover)} títulos (histórico preservado)")
        
        print(f"Inserindo {len(itens_para_atualizar)} itens no banco...")
        
        contador = 0
        total_episodios = 0
        total_sagas = 0
        
        for item in itens_para_atualizar:
            contador += 1
            progresso(contador, len(itens_para_atualizar), "Inserindo no banco")
            info = item.get("info", {})
            genero = info.get("genero", "")
            if isinstance(genero, list):
                genero = ",".join(str(g) for g in genero)
            
            duracao = str(info.get('duracao', ''))
            classificacao = str(info.get('classificacao', ''))
            sinopse = str(info.get('sinopse', ''))
            ano = str(info.get('ano', ''))
            diretor = str(info.get('diretor', ''))
            elenco = str(info.get('elenco', ''))
            if isinstance(elenco, list):
                elenco = ",".join(str(e) for e in elenco)
            
            cursor.execute("""
                INSERT INTO titulos (id, nome, nome_normalizado, tipo, hd, capa, pasta_titulo, path, is_saga, rolo, adicionado_em, is_novo, duracao, classificacao, sinopse, ano, diretor, elenco)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    nome = VALUES(nome),
                    nome_normalizado = VALUES(nome_normalizado),
                    tipo = VALUES(tipo),
                    hd = VALUES(hd),
                    capa = VALUES(capa),
                    pasta_titulo = VALUES(pasta_titulo),
                    path = VALUES(path),
                    is_saga = VALUES(is_saga),
                    rolo = VALUES(rolo),
                    is_novo = VALUES(is_novo),
                    duracao = VALUES(duracao),
                    classificacao = VALUES(classificacao),
                    sinopse = VALUES(sinopse),
                    ano = VALUES(ano),
                    diretor = VALUES(diretor),
                    elenco = VALUES(elenco)
            """, (item['idTitulo'], item['titulo'], item['titulo_normalizado'], item['tipo'], item['hd'], item.get('capa'), item['pasta_titulo'], item['videos'][0] if item.get('videos') else None, item.get('is_saga', False), info.get('rolo', ''), item.get('adicionado_em'), item.get('is_novo', False), duracao, classificacao, sinopse, ano, diretor, elenco))
            
            # Processar gêneros
            if genero:
                generos_lista = [g.strip() for g in genero.split(',') if g.strip()]
                for genero_nome in generos_lista:
                    # Inserir gênero se não existir
                    cursor.execute("INSERT IGNORE INTO generos (genero) VALUES (%s)", (genero_nome,))
                    # Buscar ID do gênero
                    cursor.execute("SELECT id FROM generos WHERE genero = %s", (genero_nome,))
                    genero_id = cursor.fetchone()[0]
                    # Associar título ao gênero
                    cursor.execute("INSERT IGNORE INTO titulo_genero (titulo_id, genero_id) VALUES (%s, %s)", (item['idTitulo'], genero_id))
            
            if item.get('series_info'):
                for temp in item['series_info']:
                    for ep in temp['episodios']:
                        total_episodios += 1
                        ep_info = ep.get('info', {})
                        cursor.execute("""
                            INSERT INTO episodios (id, titulo_id, temporada, tag, path, titulo_episodio, duracao, sinopse)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            ON DUPLICATE KEY UPDATE titulo_episodio = VALUES(titulo_episodio), duracao = VALUES(duracao), sinopse = VALUES(sinopse)
                        """, (ep['idTitulo'], item['idTitulo'], temp['nome_temporada'], ep['tag'], ep['path'], ep_info.get('titulo', ep['tag']), ep_info.get('duracao', ''), ep_info.get('sinopse', '')))
            
            if item.get('saga_info'):
                for filme in item['saga_info']:
                    total_sagas += 1
                    filme_info = filme.get('info', {})
                    cursor.execute("""
                        INSERT INTO filmes_saga (id, saga_id, nome, path, capa, duracao, sinopse)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE duracao = VALUES(duracao), sinopse = VALUES(sinopse), capa = VALUES(capa)
                    """, (filme['idTitulo'], item['idTitulo'], filme['nome'], filme['videos'][0] if filme.get('videos') else '', filme.get('capa'), filme_info.get('duracao', ''), filme_info.get('sinopse', '')))
        
        for item in itens_para_atualizar:
            marcar_como_carregado(item['pasta_titulo'])
        
        conn.commit()
        print("✓ Banco de dados atualizado com sucesso!")
        print(f"  - {len(itens_para_atualizar)} títulos atualizados")
        print(f"  - {total_episodios} episódios inseridos")
        print(f"  - {total_sagas} filmes de saga inseridos")
        return True
        
    except Error as e:
        print(f"✗ Erro ao atualizar banco: {e}")
        traceback.print_exc()
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("GERADOR DE CATÁLOGO MOMFLIX v2.4 - MySQL (Completo)")
    print("=" * 60)
    
    try:
        tipos_selecionados, forcar_reset = selecionar_opcoes()
        
        if forcar_reset:
            print("\n⚠ MODO RESET ATIVADO - Todos os dados serão reprocessados!")
        
        itens = coletar_itens(tipos_selecionados)
        itens = processar_catalogo(itens)
        
        if atualizar_banco_dados(itens, tipos_selecionados, forcar_reset):
            print(f"\n✅ Catálogo atualizado para {', '.join(tipos_selecionados)} com sucesso!")
        else:
            print(f"\n⚠ Catálogo coletado mas houve erro ao salvar no MySQL")
            
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        traceback.print_exc()
        with open("erro_catalogo.txt", "w", encoding="utf-8") as f:
            f.write("Ocorreu um erro ao gerar o catálogo:\n\n")
            traceback.print_exc(file=f)
        print("\nDetalhes salvos em erro_catalogo.txt")
    
    input("\n\nPressione ENTER para fechar...")