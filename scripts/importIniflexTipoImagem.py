### Importação de bibliotecas ###
import csv
import mysql.connector
from mysql.connector import Error, connect
from mysql.connector import connection

### Definições das Funções ###
def create_server_connection():
    connection = None
    try:
        connection = mysql.connector.connect(host='localhost',
                                             database='CIM',
                                             user='CIM',
                                             password='CIM')
        print("Mysql Database Connected")
    except Error as err:
            print(f"Error: '{err}'")
    return connection
def remove_table():
    try:
        connection = create_server_connection()
        cursor = connection.cursor()
        mySql_insert_query = """DELETE FROM tipoimagemitem"""
        cursor.execute(mySql_insert_query)
        connection.commit()
        print("Record removed successfully tipoimagemitem table")

    except mysql.connector.Error as error:
           print("Failed to remove MySQL table {}".format(error))

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection is closed")
def insert_varibles_into_table(codigo_item, versao_item, id_tipo_imagem, descricao_tipo_imagem):
    try:
        connection = create_server_connection()
        cursor = connection.cursor()
        mySql_insert_query = """INSERT INTO tipoimagemitem (codigo_item, versao_item, id_tipo_imagem, descricao_tipo_imagem) 
                                VALUES (%s, %s, %s, %s) """

        record = (codigo_item, versao_item, id_tipo_imagem, descricao_tipo_imagem)
        print(record)
        cursor.execute(mySql_insert_query, record)
        connection.commit()
        print("Record inserted successfully into perfilcores table")

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
with open ('./import/TIPO_IMAGEM_FILA.csv', newline='', encoding='latin-1') as csvfile:
    fila = csv.reader(csvfile,delimiter=';', quotechar='"')
    for row in fila:
        print(', '.join(row))
        codigo_item = row[0]
        versao = row[1]
        id_imagem = row[2]
        descricao_tipo_imagem = row[3]
        #   print(row)
        insert_varibles_into_table(codigo_item, versao, id_imagem, descricao_tipo_imagem) ## Inicia insert no banco, de forma individual
