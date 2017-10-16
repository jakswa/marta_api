pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh 'npm install'
      }
    }
    stage('Echo HI') {
      parallel {
        stage('Test') {
          steps {
            sh 'npm run-script test'
          }
        }
        stage('echo HI') {
          steps {
            sh 'node -e "console.log(\'HI\')"'
          }
        }
      }
    }
  }
}