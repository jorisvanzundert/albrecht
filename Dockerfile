FROM ubuntu:artful

LABEL maintainer "Joris J. van Zundert <joris.van.zundert@gmail.com>"

RUN apt-get update
RUN apt-get install -y sudo
RUN useradd -ms /bin/bash theo
RUN echo "theo ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/theo && \
    chmod 0440 /etc/sudoers.d/theo
USER theo
RUN sudo apt-get install -y apache2 iipimage-server software-properties-common gnupg2
RUN sudo apt-get install -y libcurl4-openssl-dev apache2-dev libapr1-dev libaprutil1-dev
RUN sudo apt-get install -y vim git iputils-ping
RUN sudo curl -sSL https://rvm.io/mpapis.asc | gpg2 --import -
RUN sudo curl -L https://get.rvm.io | bash -s stable
RUN /bin/bash -c "source ~/.bash_profile"
RUN /bin/bash -l -c "rvm install 2.4.1"
RUN /bin/bash -l -c "gem install passenger --no-rdoc --no-ri"
RUN /bin/bash -l -c "passenger-install-apache2-module --auto --languages ruby"
COPY ./docker_resources/etc/apache2 /etc/apache2/
WORKDIR /home/theo
RUN sudo mkdir WebApps
WORKDIR /home/theo/WebApps
RUN sudo mkdir albrecht
COPY ./app /home/theo/WebApps/albrecht/
COPY ./docker_resources/usr/local/bin /usr/local/bin/
RUN /bin/bash -l -c "sudo chmod g+x /usr/local/bin/bootstrap_albrecht"
RUN sudo mkdir /var/www/fcgi
RUN sudo mkdir /var/www/fcgi/iipimage-server
RUN /bin/bash -l -c "sudo cp /usr/lib/iipimage-server/iipsrv.fcgi /var/www/fcgi/iipimage-server/"
RUN /bin/bash -l -c "gem install sinatra --no-rdoc --no-ri"
RUN /bin/bash -l -c "gem install logger --no-rdoc --no-ri"
RUN /bin/bash -l -c "gem install sinatra-contrib --no-rdoc --no-ri"
RUN /bin/bash -l -c "cd /etc/apache2/mods-enabled;sudo ln -s ../mods-available/passenger.conf passenger.conf;sudo ln -s ../mods-available/passenger.load passenger.load;cd ../sites-enabled;sudo ln -s ../sites-available/albrecht.conf albrecht.conf"
RUN /bin/bash -l -c "cd /etc/apache2/sites-enabled;sudo rm 000-default.conf"
RUN /bin/bash -l -c "sudo chmod a+w /home/theo/WebApps/albrecht/log"
