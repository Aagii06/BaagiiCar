allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
// Plugins (e.g. jni) ask for Flutter's default NDK; build them all with the one the app uses (app/build.gradle.kts).
subprojects {
    val pinNdk = {
        extensions.findByType(com.android.build.gradle.BaseExtension::class.java)?.ndkVersion = "27.0.12077973"
    }
    if (state.executed) pinNdk() else afterEvaluate { pinNdk() }
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
