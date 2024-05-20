#!bin/bash
# Script para remover arquivos PDF gerados pela API do Iniflex referente as OPs Digitais
DIR_CIM="/var/www/html/CIM/files/"
find ${DIR_CIM} -type f -iname rpcp156* -daystart -mtime -1 -exec rm {} \;