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
def insert_varibles_into_table(recurso, etapa, seq_fila, op, cod_item, desc_item, cod_clicheria):
    try:
        connection = create_server_connection()
        cursor = connection.cursor()
        mySql_insert_query = """INSERT INTO pcpfila (recurso, etapa, seq_fila, op, codigo_item, descricao_item, cod_clicheria) 
                                VALUES (%s, %s, %s, %s, %s, %s, %s) """

        record = (recurso, etapa, seq_fila, op, cod_item, desc_item, cod_clicheria)
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

### Inicio do Script ####
remove_table() # Remove dados atuais da tablea, já que os novos virão da importação

### Inicia leitura do arquivo em CSV
with open ('./import/CIMINIFLEX.csv', newline='', encoding='latin-1') as csvfile:
    fila = csv.reader(csvfile,delimiter=';', quotechar='"')
    for row in fila:
        #print(', '.join(row))
        recurso = row[2]
        etapa = row[1]
        seq_fila = row[3]
        op = row[4]
        cod_item = row[5]
        desc_item = row[7]
        cod_clicheria = row[12]
        #   print(row)
        insert_varibles_into_table(recurso, etapa, seq_fila, op, cod_item, desc_item, cod_clicheria) ## Inicia insert no banco, de forma individual
