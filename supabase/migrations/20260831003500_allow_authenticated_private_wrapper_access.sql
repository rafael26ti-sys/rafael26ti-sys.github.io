grant usage on schema private to authenticated, service_role;

comment on schema private is
'Funções internas não expostas pela Data API; authenticated recebe somente USAGE para executar wrappers públicos autorizados.';
