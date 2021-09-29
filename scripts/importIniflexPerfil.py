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
        mySql_insert_query = """DELETE FROM perfilcores"""
        cursor.execute(mySql_insert_query)
        connection.commit()
        print("Record removed successfully perfilcores table")

    except mysql.connector.Error as error:
           print("Failed to remove MySQL table {}".format(error))

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection is closed")
def insert_varibles_into_table(codigo_item, seq_cor, desc_cor, anilox, densidade, tv, lab):
    try:
        connection = create_server_connection()
        cursor = connection.cursor()
        mySql_insert_query = """INSERT INTO perfilcores (codigo_item, seq_cor, desc_cor, anilox, densidade, tv, lab) 
                                VALUES (%s, %s, %s, %s, %s, %s, %s) """

        record = (codigo_item, seq_cor, desc_cor, anilox, densidade, tv, lab)
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
with open ('./import/PERFIL_CORES.csv', newline='', encoding='latin-1') as csvfile:
    fila = csv.reader(csvfile,delimiter=';', quotechar='"')
    for row in fila:
        #print(', '.join(row))
        codigo_item = row[0]
        seq_cor = row[1]
        desc_cor = row[3]
        anilox = row[3]
        densidade = row[4]
        tv = row[5]
        lab = row[6]
        #   print(row)
        insert_varibles_into_table(codigo_item, seq_cor, desc_cor, anilox, densidade, tv, lab) ## Inicia insert no banco, de forma individual
