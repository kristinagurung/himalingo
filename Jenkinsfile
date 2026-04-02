pipeline {
  agent any

  stages {

    stage('Start') {
      steps {
        echo 'Pipeline started successfully'
      }
    }

    stage('Check Files') {
      steps {
        sh 'ls'
      }
    }

    stage('Frontend Build') {
      steps {
        dir('frontend') {
          sh 'echo Installing frontend dependencies'
          sh 'npm install || true'
          sh 'echo Building frontend'
          sh 'npm run build || true'
        }
      }
    }

    stage('Backend Start') {
      steps {
        dir('backend') {
          sh 'echo Starting backend'
          sh 'python3 --version || true'
        }
      }
    }

  }
}
