FROM mongo:latest
# This copies both of your SQL/Dump files into the auto-import folder
COPY mcq_course_357_dump.sql /docker-entrypoint-initdb.d/
COPY query_dump.sql /docker-entrypoint-initdb.d/
EXPOSE 27017
