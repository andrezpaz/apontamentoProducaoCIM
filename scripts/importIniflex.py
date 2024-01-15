### Importação de bibliotecas ###
import csv
import mysql.connector
from mysql.connector import Error, connect
from mysql.connector import connection
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

### Definições das Funções ###
def create_server_connection():
    connection = None
    try:
        connection = mysql.connector.connect(host=os.getenv("MYSQL_HOST"),
                                             database=os.getenv("MYSQL_DB"),
                                             user=os.getenv("MYSQL_USER"),
                                             password=os.getenv("MYSQL_PASS")
                                             )
        print("Mysql Database Connected")
    except Error as err:
            print(f"Error: '{err}'")
    return connection
def remove_table():
    try:
        connection = create_server_connection()
        cursor = connection.cursor()
        mySql_insert_query = """DELETE FROM pcpfila"""
        cursor.execute(mySql_insert_query)
        connection.commit()
        print("Record removed successfully fila table")

    except mysql.connector.Error as error:
           print("Failed to remove MySQL table {}".format(error))

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection is closed")
def insert_varibles_into_table(recurso, etapa, seq_fila, op, cod_item, desc_item, cod_clicheria, iniprog, fimprog, mrp, quantidade, peso, velocidade_item, previsoes_entregas, quantidade_cores, situacao_recurso):
    try:
        connection = create_server_connection()
        cursor = connection.cursor()
        mySql_insert_query = """INSERT INTO pcpfila (recurso, etapa, seq_fila, op, codigo_item, descricao_item, cod_clicheria, inicioprog, fimprog, mrp, quantidade, peso, velocidade_item, previsoes_entregas, quantidade_cores, situacao_recurso) 
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) """

        record = (recurso, etapa, seq_fila, op, cod_item, desc_item, cod_clicheria, iniprog, fimprog, mrp, quantidade, peso, velocidade_item, previsoes_entregas, quantidade_cores, situacao_recurso)
        print(record)
        cursor.execute(mySql_insert_query, record)
        connection.commit()
        print("Record inserted successfully into fila table")

    except mysql.connector.Error as error:
           print("Failed to insert into MySQL table {}".format(error))

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection is closed")


def check_value_index(data, index, newData=None):
    if len(data) > index and data[index] != '':
        return data[index]
    else:
        if newData is not None:
            return newData
        else:
            return None

def format_date(data):
    return datetime(int(data.split("/")[2].split(" ")[0]), #Ano
                    int(data.split("/")[1]), #Mes
                    int(data.split("/")[0]), #Dia
                    int(data.split(" ")[1].split(":")[0]), ##Hora 
                    int(data.split(" ")[1].split(":")[1])).isoformat().replace("T", " ") # Minuto e transformacao

### Inicio do Script ####
remove_table() # Remove dados atuais da tablea, já que os novos virão da importação

### Inicia leitura do arquivo em CSV
with open (os.getenv("PATH_IMPORT_CSV")+'/CIMINIFLEX.csv', newline='', encoding='latin-1') as csvfile:
    fila = csv.reader(csvfile,delimiter=';', quotechar='"')
    for row in fila:
        recurso = row[2]
        etapa = row[1]
        seq_fila = check_value_index(row,3,0)
        op = row[4]
        cod_item = row[5]
        desc_item = row[7]
        quantidade = round(float(row[8].replace(',','.')),3)
        peso = round(float(row[9].replace(',','.')),3)
        ini_prog = check_value_index(row,10)
        fim_prog = check_value_index(row,11)
        cod_clicheria = check_value_index(row,12)
        ini_prog_format = format_date(ini_prog)
        fim_prog_format = ini_prog_format if fim_prog is None else format_date(fim_prog)
        numeroMRP = check_value_index(row,13)
        velocidadeItem = check_value_index(row,14)
        previsaoEntrega = check_value_index(row,15)
        quantidadeCores = check_value_index(row,16)
        situacaoRecurso = check_value_index(row,17)
        insert_varibles_into_table(recurso, etapa, seq_fila, op, cod_item, desc_item, cod_clicheria, 
                                   ini_prog_format, fim_prog_format, numeroMRP, quantidade, peso, velocidadeItem,
                                   previsaoEntrega, quantidadeCores, situacaoRecurso) ## Inicia insert no banco, de forma individual
