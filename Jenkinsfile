pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        git(url: 'https://github.com/jakswa/marta_api', branch: 'master')
      }
    }
  }
}