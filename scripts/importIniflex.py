### Importação de bibliotecas ###
import csv
import mysql.connector
from mysql.connector import Error, connect
from mysql.connector import connection
from datetime import datetime
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
def insert_varibles_into_table(recurso, etapa, seq_fila, op, cod_item, desc_item, cod_clicheria, iniprog, fimprog, mrp, quantidade, peso):
    try:
        connection = create_server_connection()
        cursor = connection.cursor()
        mySql_insert_query = """INSERT INTO pcpfila (recurso, etapa, seq_fila, op, codigo_item, descricao_item, cod_clicheria, inicioprog, fimprog, mrp, quantidade, peso) 
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) """

        record = (recurso, etapa, seq_fila, op, cod_item, desc_item, cod_clicheria, iniprog, fimprog, mrp, quantidade, peso)
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
with open ('./CIMINIFLEX.csv', newline='', encoding='latin-1') as csvfile:
    fila = csv.reader(csvfile,delimiter=';', quotechar='"')
    for row in fila:
        recurso = row[2]
        etapa = row[1]
        seq_fila = row[3]
        op = row[4]
        cod_item = row[5]
        desc_item = row[7]
        quantidade = round(float(row[8].replace(',','.')),3)
        peso = round(float(row[9].replace(',','.')),3)
        ini_prog = row[10]
        fim_prog = row[11]
        cod_clicheria = row[12]
        ini_prog_format = datetime(int(ini_prog.split("/")[2].split(" ")[0]), #Ano
                                   int(ini_prog.split("/")[1]), #Mes
                                   int(ini_prog.split("/")[0]), #Dia
                                   int(ini_prog.split(" ")[1].split(":")[0]), ##Hora 
                                   int(ini_prog.split(" ")[1].split(":")[1])).isoformat().replace("T", " ") # Minuto e transformacao
        if (row[11] == ''):
            fim_prog_format = ini_prog_format
        else:
            fim_prog_format = datetime(int(fim_prog.split("/")[2].split(" ")[0]),
                                    int(fim_prog.split("/")[1]), 
                                    int(fim_prog.split("/")[0]), 
                                    int(fim_prog.split(" ")[1].split(":")[0]), 
                                    int(fim_prog.split(" ")[1].split(":")[1])).isoformat().replace("T", " ")
            
        if (row[13] == ''):
            numeroMRP = None
        else:
            numeroMRP = row[13]
    
        insert_varibles_into_table(recurso, etapa, seq_fila, op, cod_item, desc_item, cod_clicheria, 
                                   ini_prog_format, fim_prog_format, numeroMRP, quantidade, peso) ## Inicia insert no banco, de forma individual
