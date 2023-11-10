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
        mySql_insert_query = """DELETE FROM pcpfilacomponentes"""
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
def insert_varibles_into_table(op, prioridade, recurso, etapa, componente, saldo, tipo_componente, op_componente):
    try:
        connection = create_server_connection()
        cursor = connection.cursor()
        mySql_insert_query = """INSERT INTO pcpfilacomponentes (op, prioridade, recurso, etapa, componente, saldo, tipo_componente, op_componente) 
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) """

        record = (op, prioridade, recurso, etapa, componente, saldo, tipo_componente, op_componente)
        print(record)
        cursor.execute(mySql_insert_query, record)
        connection.commit()
        print("Record inserted successfully into pcpfilacomponentes table")

    except mysql.connector.Error as error:
           print("Failed to insert into MySQL table {}".format(error))

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection is closed")

### Inicio do Script ####
remove_table() # Remove dados atuais da tablea, já que os novos virão da importação

### Inicia leitura do arquivo em CSV
with open (os.getenv("PATH_IMPORT_CSV")+'/CIMINIFLEX_COMPONENTES.csv', newline='', encoding='latin-1') as csvfile:
    fila = csv.reader(csvfile,delimiter=';', quotechar='"')
    for row in fila:
        op = row[1]
        if (row[2] == ''):
            prioridade = 0
        else:
            prioridade = row[2]
        recurso = row[3]
        etapa = row[4]
        cod_componente = row[5]
        if (row[6] == ''):
            saldo_componente = 0
        else:
            saldo_componente = row[6].replace(',','.')
        tipo_componente = row[7]
        if (row[8] == ''):
            op_componente = None
        else:
            op_componente = row[8]
        
        insert_varibles_into_table(op, prioridade, recurso, etapa, cod_componente, saldo_componente, tipo_componente, op_componente) ## Inicia insert no banco, de forma individual
