import os
import re
import json
import traceback
import hashlib
import mysql.connector
from mysql.connector import Error
import time

# CONFIGURAÇÃO DO BANCO DE DADOS
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': '',
    'database': 'mom_flix'
}

# ATENÇÃO: AJUSTE ESTES CAMINHOS PARA O QUE VOCÊ TEM AÍ
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

def buscar_ou_criar_info(pasta_titulo, nome_titulo, tipo, episodios_data=None, saga_data=None, id_titulo=None):
    info_path = os.path.join(pasta_titulo, "info.json")
    
    if os.path.exists(info_path):
        try:
            with open(info_path, "r", encoding="utf-8") as f:
                info = json.load(f)
                if episodios_data and "episodios" not in info:
                    info["episodios"] = {}
                if saga_data and "filmes_saga" not in info:
                    info["filmes_saga"] = {}
                
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
        "elenco": ""
    }
    
    if episodios_data:
        info_padrao["episodios"] = {}
    if saga_data:
        info_padrao["filmes_saga"] = {}
    
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

def coletar_itens():
    itens = []
    print("Iniciando varredura das unidades...")
    
    for raiz_unidade, label_hd in UNIDADES.items():
        print(f"  Unidade: {raiz_unidade} -> {label_hd}")
        if not os.path.isdir(raiz_unidade):
            print("    ⚠ Pasta não encontrada, pulando.")
            continue

        for tipo, pasta_cat in TIPOS.items():
            base_cat = os.path.join(raiz_unidade, pasta_cat)
            if not os.path.isdir(base_cat):
                continue

            if tipo == "filme":
                for nome_titulo in sorted(os.listdir(base_cat), key=str.lower):
                    pasta_titulo = os.path.join(base_cat, nome_titulo)
                    if not os.path.isdir(pasta_titulo):
                        continue

                    videos = listar_videos_na_pasta(pasta_titulo)
                    subpastas_com_videos = []
                    
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
                for nome_serie in sorted(os.listdir(base_cat), key=str.lower):
                    pasta_serie = os.path.join(base_cat, nome_serie)
                    if not os.path.isdir(pasta_serie):
                        continue

                    temporadas = []
                    for nome_temp in sorted(os.listdir(pasta_serie), key=str.lower):
                        pasta_temp = os.path.join(pasta_serie, nome_temp)
                        if not os.path.isdir(pasta_temp):
                            continue
                        
                        is_temporada = ("temporada" in nome_temp.lower() or re.search(r'\b(s?\d{1,2})\b', nome_temp.lower()))
                        
                        if is_temporada:
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

                    if not temporadas:
                        continue

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

def atualizar_banco_dados(itens):
    conn = conectar_db()
    if not conn:
        print("❌ Não foi possível conectar ao banco de dados")
        return False
    
    cursor = conn.cursor()
    
    try:
        print("\n📊 Atualizando banco de dados MySQL...")
        
        stats = {
            "total_titulos": len(itens),
            "filmes": len([i for i in itens if i["tipo"] == "filme"]),
            "series": len([i for i in itens if i["tipo"] == "serie"]),
            "bls": len([i for i in itens if i["tipo"] == "bl"]),
            "animes": len([i for i in itens if i["tipo"] == "anime"]),
            "donghuas": len([i for i in itens if i["tipo"] == "donghua"]),
            "sagas": len([i for i in itens if i.get("is_saga")]),
            "total_episodios": 0,
            "novidades": len([i for i in itens if i.get("is_novo")])
        }
        
        for item in itens:
            if item.get("series_info"):
                for temp in item["series_info"]:
                    stats["total_episodios"] += len(temp["episodios"])
        
        cursor.execute("""
            INSERT INTO estatisticas (id, total_titulos, filmes, series, bls, animes, donghuas, sagas, total_episodios, novidades, contador_atualizacoes)
            VALUES (1, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
            ON DUPLICATE KEY UPDATE
                total_titulos = VALUES(total_titulos),
                filmes = VALUES(filmes),
                series = VALUES(series),
                bls = VALUES(bls),
                animes = VALUES(animes),
                donghuas = VALUES(donghuas),
                sagas = VALUES(sagas),
                total_episodios = VALUES(total_episodios),
                novidades = VALUES(novidades),
                contador_atualizacoes = contador_atualizacoes + 1
        """, (stats['total_titulos'], stats['filmes'], stats['series'], stats['bls'], stats['animes'], stats['donghuas'], stats['sagas'], stats['total_episodios'], stats['novidades']))
        
        for item in itens:
            info = item.get("info", {})
            genero = info.get("genero", "")
            if isinstance(genero, list):
                genero = ",".join(str(g) for g in genero)
            
            # Converter todos os valores para string
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
                ON DUPLICATE KEY UPDATE capa = VALUES(capa), path = VALUES(path), is_novo = VALUES(is_novo), rolo = VALUES(rolo), duracao = VALUES(duracao), classificacao = VALUES(classificacao), sinopse = VALUES(sinopse), ano = VALUES(ano), diretor = VALUES(diretor), elenco = VALUES(elenco)
            """, (item['idTitulo'], item['titulo'], item['titulo_normalizado'], item['tipo'], item['hd'], item.get('capa'), item['pasta_titulo'], item['videos'][0] if item.get('videos') else None, item.get('is_saga', False), info.get('rolo', ''), item.get('adicionado_em'), item.get('is_novo', False), duracao, classificacao, sinopse, ano, diretor, elenco))
            
            if genero:
                for gen in [g.strip() for g in genero.split(",") if g.strip()]:
                    cursor.execute("INSERT IGNORE INTO generos (genero) VALUES (%s)", (gen,))
                    cursor.execute("SELECT id FROM generos WHERE genero = %s", (gen,))
                    result = cursor.fetchone()
                    if result:
                        cursor.execute("INSERT IGNORE INTO titulo_genero (titulo_id, genero_id) VALUES (%s, %s)", (item['idTitulo'], result[0]))
            
            if item.get('series_info'):
                for temp in item['series_info']:
                    for ep in temp['episodios']:
                        ep_info = ep.get('info', {})
                        cursor.execute("""
                            INSERT INTO episodios (id, titulo_id, temporada, tag, path, titulo_episodio, duracao, sinopse)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            ON DUPLICATE KEY UPDATE titulo_episodio = VALUES(titulo_episodio), duracao = VALUES(duracao), sinopse = VALUES(sinopse)
                        """, (ep['idTitulo'], item['idTitulo'], temp['nome_temporada'], ep['tag'], ep['path'], ep_info.get('titulo', ep['tag']), ep_info.get('duracao', ''), ep_info.get('sinopse', '')))
            
            if item.get('saga_info'):
                for filme in item['saga_info']:
                    filme_info = filme.get('info', {})
                    cursor.execute("""
                        INSERT INTO filmes_saga (id, saga_id, nome, path, capa, duracao, sinopse)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE duracao = VALUES(duracao), sinopse = VALUES(sinopse), capa = VALUES(capa)
                    """, (filme['idTitulo'], item['idTitulo'], filme['nome'], filme['videos'][0] if filme.get('videos') else '', filme.get('capa'), filme_info.get('duracao', ''), filme_info.get('sinopse', '')))
        
        conn.commit()
        print("✓ Banco de dados atualizado com sucesso!")
        print(f"  - {stats['total_titulos']} títulos")
        print(f"  - {stats['total_episodios']} episódios")
        print(f"  - {stats['novidades']} novidades")
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
    print("GERADOR DE CATÁLOGO MOMFLIX v2.0 - MySQL")
    print("=" * 60)
    
    try:
        itens = coletar_itens()
        itens = processar_catalogo(itens)
        
        if atualizar_banco_dados(itens):
            print("\n✅ Catálogo gerado e salvo no MySQL com sucesso!")
        else:
            print("\n⚠ Catálogo coletado mas houve erro ao salvar no MySQL")
            
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        traceback.print_exc()
        with open("erro_catalogo.txt", "w", encoding="utf-8") as f:
            f.write("Ocorreu um erro ao gerar o catálogo:\n\n")
            traceback.print_exc(file=f)
        print("\nDetalhes salvos em erro_catalogo.txt")
    finally:
        input("\n\nPressione ENTER para fechar...")
