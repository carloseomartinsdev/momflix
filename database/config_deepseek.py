# Configuração da API DeepSeek
DEEPSEEK_API_KEY = "sk-5b573bc1241641b98541453492fc07e4"  # Substitua pela sua chave da API
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
                    
# Configurações do processamento
DELAY_ENTRE_REQUESTS = 1  # Segundos entre cada request (para evitar rate limit)
MAX_RETRIES = 3  # Número máximo de tentativas por título
TIMEOUT_REQUEST = 30  # Timeout em segundos para cada request

# Caminhos
# CATALOGO_JSON não é mais necessário - dados vem do MySQL