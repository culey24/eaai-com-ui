FROM postgres:14.3
 
WORKDIR /app
 
COPY .env .
 
COPY databases/postgresql/ .

# Install locales and generate the vi_VN locale
RUN localedef -i de_DE -c -f UTF-8 -A /usr/share/locale/locale.alias de_DE.UTF-8

# Set default environment variables for the system
ENV LANG de_DE.utf8
ENV LC_ALL de_DE.utf8
